import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './TicketDetail.css';

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [users, setUsers] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);

  useEffect(() => {
    loadTicket();
    if (isAdmin) {
      loadUsers();
    }
  }, [id, isAdmin]);

  const loadTicket = async () => {
    try {
      const response = await api.getTicket(id);
      setTicket(response.data);
      setStatus(response.data.status);
      setPriority(response.data.priority);
      setAssigneeId(response.data.assignee_id || '');
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateTicket(id, { status: newStatus });
      setStatus(newStatus);
      loadTicket();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssign = async () => {
    try {
      const payload = { assignee_id: assigneeId ? parseInt(assigneeId, 10) : null };
      await api.updateTicket(id, payload);
      loadTicket();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      await api.addReply(id, replyMessage, isInternal, attachments);
      setReplyMessage('');
      setIsInternal(false);
      setAttachments([]);
      setShowReplyForm(false);
      loadTicket();
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (days === 1) {
      return '1 day ago';
    }
    return `${days} days ago`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': '#3b82f6',
      'In Progress': '#f59e0b',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Urgent': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="ticket-detail-container">
        <Sidebar isAdmin={isAdmin} />
        <div className="ticket-detail-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-detail-container">
        <Sidebar isAdmin={isAdmin} />
        <div className="ticket-detail-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Ticket not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-container">
      <Sidebar isAdmin={isAdmin} />
      <div className="ticket-detail-content">
        <div className="ticket-header">
          <div className="breadcrumbs">
            <Link to={isAdmin ? '/admin/tickets' : '/tickets'}>
              {isAdmin ? 'All Tickets' : 'My Tickets'}
            </Link>
            <span> / </span>
            <span>Ticket #{ticket.ticket_id}</span>
          </div>
          <h1>Ticket #{ticket.ticket_id}: {ticket.subject}</h1>
          <div className="ticket-actions">
            <button onClick={() => setShowReplyForm(!showReplyForm)} className="action-btn">
              <span>➕</span> Add Reply
            </button>
            {isAdmin && (
              <>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="status-select"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <select
                  value={assigneeId}
                  onChange={async (e) => {
                    setAssigneeId(e.target.value);
                    // assign immediately on change for clarity
                    try {
                      const val = e.target.value;
                      const payload = { assignee_id: val ? parseInt(val, 10) : null };
                      await api.updateTicket(id, payload);
                      loadTicket();
                    } catch (err) {
                      console.error('Error assigning ticket:', err);
                    }
                  }}
                  className="assign-select"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="ticket-body">
          <div className="ticket-details">
            <h2>Details</h2>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(ticket.status) }}
              >
                {ticket.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Requester:</span>
              <span>{ticket.requester_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Assignee:</span>
              <span>{ticket.assignee_name || 'Unassigned'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Priority:</span>
              <span
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(ticket.priority) }}
              >
                {ticket.priority}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category:</span>
              <span>{ticket.category || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated:</span>
              <span>{formatDate(ticket.updated_at)}</span>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="attachments-section">
                <h3>Attachments</h3>
                {ticket.attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item">
                    <span>📎</span>
                    <span>{attachment.original_name}</span>
                    <span className="file-size">({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                    <a
                      href={`http://localhost:5000/uploads/${attachment.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ticket-conversation">
            <h2>Conversation</h2>
            {showReplyForm && (
              <form onSubmit={handleReply} className="reply-form">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows="4"
                  required
                />
                {isAdmin && (
                  <label className="internal-note-checkbox">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    Internal Note
                  </label>
                )}
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(Array.from(e.target.files))}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="reply-actions">
                  <button type="button" onClick={() => setShowReplyForm(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">Send Reply</button>
                </div>
              </form>
            )}

            <div className="conversation-list">
              {ticket.conversations?.map((conv) => (
                <div key={conv.id} className={`conversation-item ${conv.is_internal ? 'internal' : ''}`}>
                  <div className="conv-header">
                    <div className="conv-user">
                      <div className="conv-avatar">{conv.user_name?.charAt(0) || 'U'}</div>
                      <div>
                        <div className="conv-name">
                          {conv.user_name}
                          {conv.is_internal && <span className="internal-badge">🔒 Internal Note</span>}
                        </div>
                        <div className="conv-time">{formatDate(conv.created_at)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="conv-message">{conv.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
