import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './Tickets.css';

function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [dispatchData, setDispatchData] = useState({ assignee_id: '', technician: '', sent_time: '', status: '' });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, search]);

  const loadTickets = async () => {
    try {
      const response = await api.getTickets({ status: statusFilter, search });
      setTickets(response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.getUsers();
        setUsers(res.data);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };
    loadUsers();
  }, []);
  const toast = useToast();

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setDispatchData({
      assignee_id: ticket.assignee_id || '',
      technician: ticket.technician || '',
      sent_time: ticket.sent_time ? ticket.sent_time.replace(' ', 'T') : '',
      status: ticket.status || 'Open'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  const submitDispatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        assignee_id: dispatchData.assignee_id ? parseInt(dispatchData.assignee_id, 10) : null,
        technician: dispatchData.technician || null,
        sent_time: dispatchData.sent_time || null,
        status: dispatchData.status || null
      };
      await api.updateTicket(selectedTicket.id, payload);
      closeModal();
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update ticket');
    }
  };

  const assignTo = async (ticketId, userId) => {
    try {
      const payload = { assignee_id: userId ? parseInt(userId, 10) : null };
      await api.updateTicket(ticketId, payload);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign ticket');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Open': '#3b82f6',
      'In Progress': '#f59e0b',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="tickets-container">
      <Sidebar isAdmin={true} />
      <div className="tickets-content">
        <div className="tickets-header">
          <h1>All Tickets</h1>
        </div>

        <div className="filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by keyword or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </div>

        <div className="tickets-table-container">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <a href="#" onClick={(e) => { e.preventDefault(); openModal(ticket); }} className="ticket-link">
                        {ticket.ticket_id}
                      </a>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.requester_name}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadge(ticket.status) }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.priority}</td>
                    <td>
                      <select
                        value={ticket.assignee_id || ''}
                        onChange={(e) => assignTo(ticket.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Dispatch Ticket {selectedTicket.ticket_id}</h2>
            <form onSubmit={submitDispatch} className="dispatch-form">
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={dispatchData.assignee_id}
                  onChange={(e) => setDispatchData({ ...dispatchData, assignee_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Technician</label>
                <input
                  type="text"
                  value={dispatchData.technician}
                  onChange={(e) => setDispatchData({ ...dispatchData, technician: e.target.value })}
                  placeholder="Technician name"
                />
              </div>
              <div className="form-group">
                <label>Sent Time</label>
                <input
                  type="datetime-local"
                  value={dispatchData.sent_time}
                  onChange={(e) => setDispatchData({ ...dispatchData, sent_time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={dispatchData.status}
                  onChange={(e) => setDispatchData({ ...dispatchData, status: e.target.value })}
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTickets;
