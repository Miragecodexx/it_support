const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../database/db');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const notifications = require('../utils/notifications');
const socketManager = require('../utils/socket');

// Generate ticket ID
const generateTicketId = () => {
  const prefix = 'IT-';
  const random = Math.floor(Math.random() * 100000);
  return `${prefix}${random.toString().padStart(5, '0')}`;
};

// Get all tickets (admin) or user's tickets
router.get('/', authenticate, (req, res) => {
  const database = db.getDb();
  const { status, search } = req.query;

  let query = '';
  let params = [];

  if (req.user.role === 'admin') {
    query = `
      SELECT t.*, 
        u1.name as requester_name, u1.email as requester_email,
        u2.name as assignee_name
      FROM tickets t
      LEFT JOIN users u1 ON t.requester_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      WHERE 1=1
    `;
    
    if (status && status !== 'All Statuses') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (search) {
      query += ' AND (t.subject LIKE ? OR t.ticket_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY t.created_at DESC';
  } else {
    query = `
      SELECT t.*, 
        u1.name as requester_name, u1.email as requester_email,
        u2.name as assignee_name
      FROM tickets t
      LEFT JOIN users u1 ON t.requester_id = u1.id
      LEFT JOIN users u2 ON t.assignee_id = u2.id
      WHERE t.requester_id = ?
    `;
    params.push(req.user.id);
    
    if (status && status !== 'All Statuses') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (search) {
      query += ' AND (t.subject LIKE ? OR t.ticket_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY t.created_at DESC';
  }

  database.all(query, params, (err, tickets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(tickets);
  });
});

// Get single ticket
router.get('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  const ticketId = req.params.id;

  database.get(
    `SELECT t.*, 
      u1.name as requester_name, u1.email as requester_email, u1.department as requester_department, u1.phone as requester_phone,
      u2.name as assignee_name, u2.email as assignee_email
    FROM tickets t
    LEFT JOIN users u1 ON t.requester_id = u1.id
    LEFT JOIN users u2 ON t.assignee_id = u2.id
    WHERE t.id = ? OR t.ticket_id = ?`,
    [ticketId, ticketId],
    (err, ticket) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Check if user has access
      if (req.user.role !== 'admin' && ticket.requester_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get conversations
      database.all(
        `SELECT c.*, u.name as user_name, u.email as user_email
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC`,
        [ticket.id],
        (err, conversations) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get attachments
          database.all(
            `SELECT a.*, u.name as uploaded_by_name
            FROM attachments a
            LEFT JOIN users u ON a.uploaded_by = u.id
            WHERE a.ticket_id = ?
            ORDER BY a.created_at ASC`,
            [ticket.id],
            (err, attachments) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                ...ticket,
                conversations: conversations || [],
                attachments: attachments || []
              });
            }
          );
        }
      );
    }
  );
});

// Create ticket
router.post('/', authenticate, upload.array('attachments', 5), (req, res) => {
  const { subject, description, priority, category } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const database = db.getDb();
  const ticketId = generateTicketId();

  database.run(
    `INSERT INTO tickets (ticket_id, subject, description, status, priority, category, requester_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticketId, subject, description, 'Open', priority || 'Medium', category || null, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const newTicketId = this.lastID;

      // Add initial conversation
      database.run(
        'INSERT INTO conversations (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)',
        [newTicketId, req.user.id, description, 0],
        (err) => {
          if (err) {
            console.error('Error creating initial conversation:', err);
          }
        }
      );

      // Handle file uploads
      if (req.files && req.files.length > 0) {
        const filePromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            database.run(
              `INSERT INTO attachments (ticket_id, filename, original_name, file_path, file_size, uploaded_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [newTicketId, file.filename, file.originalname, file.path, file.size, req.user.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

          Promise.all(filePromises).then(() => {
            res.json({ id: newTicketId, ticket_id: ticketId, message: 'Ticket created successfully' });

            // Notify admins and requester (non-blocking)
            try {
              const database2 = db.getDb();
              database2.get('SELECT email, name FROM users WHERE id = ?', [req.user.id], (err, requester) => {
                if (!err && requester) {
                  database2.all('SELECT email FROM users WHERE role = ?', ['admin'], (err, admins) => {
                    const adminEmails = (admins || []).map(a => a.email).filter(Boolean);
                    const to = [requester.email, ...adminEmails].join(',');
                    notifications.sendEmail(to, `New ticket created: ${ticketId}`, `Ticket ${ticketId} created by ${requester.name}: ${subject}`);
                    try {
                      const io = socketManager.getIo();
                      // notify admins and requester rooms
                      io.to('role_admin').emit('ticket_created', { ticketId, subject, requesterId: req.user.id });
                      io.to(`user_${req.user.id}`).emit('ticket_created', { ticketId, subject });
                    } catch (e) {
                      // socket not initialized yet
                    }
                  });
                }
              });
            } catch (e) {
              console.error('Notification error:', e);
            }
          }).catch(() => {
            res.status(500).json({ error: 'Error uploading files' });
          });
      } else {
        res.json({ id: newTicketId, ticket_id: ticketId, message: 'Ticket created successfully' });

        // Notify admins and requester (non-blocking)
        try {
          const database2 = db.getDb();
          database2.get('SELECT email, name FROM users WHERE id = ?', [req.user.id], (err, requester) => {
            if (!err && requester) {
              database2.all('SELECT email FROM users WHERE role = ?', ['admin'], (err, admins) => {
                const adminEmails = (admins || []).map(a => a.email).filter(Boolean);
                const to = [requester.email, ...adminEmails].join(',');
                notifications.sendEmail(to, `New ticket created: ${ticketId}`, `Ticket ${ticketId} created by ${requester.name}: ${subject}`);
                try {
                  const io = socketManager.getIo();
                  io.to('role_admin').emit('ticket_created', { ticketId, subject, requesterId: req.user.id });
                  io.to(`user_${req.user.id}`).emit('ticket_created', { ticketId, subject });
                } catch (e) {}
              });
            }
          });
        } catch (e) {
          console.error('Notification error:', e);
        }
      }
    }
  );
});

// Update ticket
router.put('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  const ticketId = req.params.id;
  const { status, priority, assignee_id, subject, description } = req.body;

  // Check if user has permission
  database.get('SELECT * FROM tickets WHERE id = ? OR ticket_id = ?', [ticketId, ticketId], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'admin' && ticket.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (assignee_id !== undefined && req.user.role === 'admin') {
      updates.push('assignee_id = ?');
      params.push(assignee_id || null);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(ticketId);

    database.run(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Log status change if status was updated
        if (status && status !== ticket.status) {
          database.run(
            'INSERT INTO conversations (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)',
            [ticket.id, req.user.id, `Status changed from ${ticket.status} to ${status}`, 1],
            () => {}
          );
        }

        res.json({ message: 'Ticket updated successfully' });
      }
    );
  });
});

// Add conversation/reply
router.post('/:id/conversations', authenticate, upload.array('attachments', 5), (req, res) => {
  const database = db.getDb();
  const ticketId = req.params.id;
  const { message, is_internal } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  database.get('SELECT * FROM tickets WHERE id = ? OR ticket_id = ?', [ticketId, ticketId], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && ticket.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    database.run(
      'INSERT INTO conversations (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)',
      [ticket.id, req.user.id, message, is_internal ? 1 : 0],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Update ticket updated_at
        database.run('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticket.id], () => {});

        // Handle file uploads
        if (req.files && req.files.length > 0) {
          const filePromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
              database.run(
                `INSERT INTO attachments (ticket_id, filename, original_name, file_path, file_size, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [ticket.id, file.filename, file.originalname, file.path, file.size, req.user.id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          });

          Promise.all(filePromises).then(() => {
            res.json({ message: 'Reply added successfully' });

            // Notify relevant users (non-blocking)
            try {
              const database2 = db.getDb();
              database2.get('SELECT requester_id, assignee_id, ticket_id FROM tickets WHERE id = ?', [ticket.id], (err, t) => {
                if (!err && t) {
                  database2.get('SELECT email, name, role FROM users WHERE id = ?', [req.user.id], (err, actor) => {
                    database2.get('SELECT email, name FROM users WHERE id = ?', [t.requester_id], (err, requester) => {
                      const recipientEmails = [];
                      if (requester && requester.email) recipientEmails.push(requester.email);
                      if (t.assignee_id) {
                        database2.get('SELECT email FROM users WHERE id = ?', [t.assignee_id], (err, assignee) => {
                          if (assignee && assignee.email) recipientEmails.push(assignee.email);
                          if (recipientEmails.length > 0) {
                            const to = Array.from(new Set(recipientEmails)).join(',');
                            notifications.sendEmail(to, `New reply on ticket ${t.ticket_id}`, `${actor?.name || 'Someone'} replied: ${message}`);
                            try {
                              const io = socketManager.getIo();
                              io.to(`user_${t.requester_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                              if (t.assignee_id) io.to(`user_${t.assignee_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                              io.to('role_admin').emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                            } catch (e) {}
                          }
                        });
                      } else {
                        if (recipientEmails.length > 0) {
                          notifications.sendEmail(recipientEmails.join(','), `New reply on ticket ${t.ticket_id}`, `${actor?.name || 'Someone'} replied: ${message}`);
                          try {
                            const io = socketManager.getIo();
                            recipientEmails.forEach(() => {});
                            io.to(`user_${t.requester_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                            if (t.assignee_id) io.to(`user_${t.assignee_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                            io.to('role_admin').emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                          } catch (e) {}
                        }
                      }
                    });
                  });
                }
              });
            } catch (e) {
              console.error('Notification error:', e);
            }
          }).catch(() => {
            res.status(500).json({ error: 'Error uploading files' });
          });
        } else {
          res.json({ message: 'Reply added successfully' });

          // Notify relevant users (non-blocking)
          try {
            const database2 = db.getDb();
            database2.get('SELECT requester_id, assignee_id, ticket_id FROM tickets WHERE id = ?', [ticket.id], (err, t) => {
              if (!err && t) {
                database2.get('SELECT email, name, role FROM users WHERE id = ?', [req.user.id], (err, actor) => {
                  database2.get('SELECT email, name FROM users WHERE id = ?', [t.requester_id], (err, requester) => {
                    const recipientEmails = [];
                    if (requester && requester.email) recipientEmails.push(requester.email);
                    if (t.assignee_id) {
                      database2.get('SELECT email FROM users WHERE id = ?', [t.assignee_id], (err, assignee) => {
                        if (assignee && assignee.email) recipientEmails.push(assignee.email);
                        if (recipientEmails.length > 0) {
                          const to = Array.from(new Set(recipientEmails)).join(',');
                          notifications.sendEmail(to, `New reply on ticket ${t.ticket_id}`, `${actor?.name || 'Someone'} replied: ${message}`);
                          try {
                            const io = socketManager.getIo();
                            io.to(`user_${t.requester_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                            if (t.assignee_id) io.to(`user_${t.assignee_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                            io.to('role_admin').emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                          } catch (e) {}
                        }
                      });
                    } else {
                      if (recipientEmails.length > 0) {
                        notifications.sendEmail(recipientEmails.join(','), `New reply on ticket ${t.ticket_id}`, `${actor?.name || 'Someone'} replied: ${message}`);
                        try {
                          const io = socketManager.getIo();
                          io.to(`user_${t.requester_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                          if (t.assignee_id) io.to(`user_${t.assignee_id}`).emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                          io.to('role_admin').emit('ticket_reply', { ticketId: t.ticket_id, message, from: actor?.name });
                        } catch (e) {}
                      }
                    }
                  });
                });
              }
            });
          } catch (e) {
            console.error('Notification error:', e);
          }
        }
      }
    );
  });
});

// Get dashboard statistics
router.get('/stats/dashboard', authenticate, (req, res) => {
  const database = db.getDb();

  if (req.user.role === 'admin') {
    database.all(`
      SELECT 
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'Pending Assignment' THEN 1 ELSE 0 END) as pending_assignment,
        SUM(CASE WHEN status = 'Resolved' AND DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as resolved_today,
        AVG(CASE WHEN status = 'Resolved' THEN (julianday(updated_at) - julianday(created_at)) * 24 END) as avg_resolution_time
      FROM tickets
    `, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows[0] || {});
    });
  } else {
    database.all(`
      SELECT 
        SUM(CASE WHEN status = 'Open' AND requester_id = ? THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'In Progress' AND requester_id = ? THEN 1 ELSE 0 END) as pending_tickets,
        SUM(CASE WHEN status = 'Closed' AND requester_id = ? THEN 1 ELSE 0 END) as closed_tickets
      FROM tickets
    `, [req.user.id, req.user.id, req.user.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows[0] || {});
    });
  }
});

module.exports = router;
