import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../utils/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    open_tickets: 0,
    pending_assignment: 0,
    resolved_today: 0,
    avg_resolution_time: 0
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter]);

  const loadData = async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getStats(),
        api.getTickets({ status: statusFilter !== 'All Statuses' ? statusFilter : undefined })
      ]);
      setStats(statsRes.data);
      let filteredTickets = ticketsRes.data;
      if (priorityFilter !== 'All Priorities') {
        filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter);
      }
      setTickets(filteredTickets);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const getPriorityBadge = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Urgent': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="admin-dashboard-container">
      <Sidebar isAdmin={true} />
      <div className="admin-dashboard-content">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search tickets, staff..." />
            </div>
            <div className="header-icons">
              <span className="icon">🔔</span>
              <div className="user-avatar-small">A</div>
            </div>
          </div>
        </div>

        <div className="dashboard-title">
          <h2>Dashboard</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card-admin">
            <div className="stat-label">Open Tickets</div>
            <div className="stat-value-large">{stats.open_tickets || 0}</div>
            <div className="stat-change positive">+5% from yesterday</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-label">Pending Assignment</div>
            <div className="stat-value-large">{stats.pending_assignment || 0}</div>
            <div className="stat-change negative">-2% from yesterday</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-label">Resolved Today</div>
            <div className="stat-value-large">{stats.resolved_today || 0}</div>
            <div className="stat-change positive">+10% from yesterday</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-label">Avg. Resolution Time</div>
            <div className="stat-value-large">
              {stats.avg_resolution_time ? `${stats.avg_resolution_time.toFixed(1)} hours` : 'N/A'}
            </div>
            <div className="stat-change negative">-1.2% from last week</div>
          </div>
        </div>

        <div className="ticket-queue-section">
          <div className="queue-header">
            <h3>Ticket Queue</h3>
            <div className="queue-filters">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option>All Statuses</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option>All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
              <button className="export-btn">
                <span>⬇️</span> Export
              </button>
            </div>
          </div>

          <div className="queue-table">
            <table>
              <thead>
                <tr>
                  <th>TICKET ID</th>
                  <th>SUBJECT</th>
                  <th>SUBMITTER</th>
                  <th>ASSIGNED TO</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>DATE CREATED</th>
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
                  tickets.slice(0, 10).map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <Link to={`/admin/ticket/${ticket.id}`} className="ticket-link">
                          {ticket.ticket_id}
                        </Link>
                      </td>
                      <td>{ticket.subject}</td>
                      <td>{ticket.requester_name}</td>
                      <td>{ticket.assignee_name || 'Unassigned'}</td>
                      <td>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityBadge(ticket.priority) }}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusBadge(ticket.status) }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
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

export default AdminDashboard;
