import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './Dashboard.css';

function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open_tickets: 0, pending_tickets: 0, closed_tickets: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getStats(),
        api.getTickets()
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const closedTickets = tickets.filter(t => t.status === 'Closed' || t.status === 'Resolved');

  const getStatusBadge = (status) => {
    const colors = {
      'Open': '#3b82f6',
      'In Progress': '#3b82f6',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.name || 'User'}!</h1>
            <p>Here's a summary of your support tickets.</p>
          </div>
          <Link to="/submit" className="create-ticket-btn">
            <span>➕</span> Create New Ticket
          </Link>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-label">Open Tickets</div>
            <div className="stat-value">{stats.open_tickets || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Tickets</div>
            <div className="stat-value pending">{stats.pending_tickets || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Closed Tickets</div>
            <div className="stat-value">{stats.closed_tickets || 0}</div>
          </div>
        </div>

        <div className="tickets-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'open' ? 'active' : ''}`}
              onClick={() => setActiveTab('open')}
            >
              My Open Tickets
            </button>
            <button
              className={`tab ${activeTab === 'closed' ? 'active' : ''}`}
              onClick={() => setActiveTab('closed')}
            >
              Recently Closed Tickets
            </button>
          </div>

          <div className="tickets-table">
            <table>
              <thead>
                <tr>
                  <th>TICKET ID</th>
                  <th>SUBJECT</th>
                  <th>STATUS</th>
                  <th>LAST UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      Loading...
                    </td>
                  </tr>
                ) : (activeTab === 'open' ? openTickets : closedTickets).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'open' ? openTickets : closedTickets).slice(0, 10).map((ticket) => (
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
                      <td>{new Date(ticket.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
