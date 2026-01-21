import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../utils/api';
import './Tickets.css';

function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

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
      <Sidebar />
      <div className="tickets-content">
        <div className="tickets-header">
          <h1>My Support Tickets</h1>
          <Link to="/submit" className="submit-btn">
            <span>➕</span> Submit New Ticket
          </Link>
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
                <th>Status</th>
                <th>Last Updated</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                        {ticket.ticket_id}
                      </Link>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadge(ticket.status) }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                    <td>{ticket.assignee_name || 'Unassigned'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserTickets;
