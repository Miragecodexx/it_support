import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import './Reports.css';

function Reports() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [chartData, setChartData] = useState({
    priorityData: [],
    statusData: [],
    timelineData: [],
  });

  useEffect(() => {
    fetchStats();
  }, [filter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.getTickets();
      const tickets = response.data || [];
      console.log('Raw tickets:', tickets);

      const now = new Date();
      let filtered = tickets;

      if (filter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = tickets.filter(t => new Date(t.created_at) >= sevenDaysAgo);
      } else if (filter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = tickets.filter(t => new Date(t.created_at) >= thirtyDaysAgo);
      }

      console.log('Filtered tickets:', filtered);
      console.log('Sample ticket:', filtered[0]);

      const statsData = {
        total: filtered.length,
        open: filtered.filter(t => t.status === 'Open' || t.status === 'open').length,
        closed: filtered.filter(t => t.status === 'Closed' || t.status === 'closed').length,
        urgent: filtered.filter(t => t.priority === 'Urgent' || t.priority === 'urgent').length,
        avgResolutionTime: calculateAvgResolution(filtered),
        byPriority: {
          urgent: filtered.filter(t => t.priority === 'Urgent' || t.priority === 'urgent').length,
          high: filtered.filter(t => t.priority === 'High' || t.priority === 'high').length,
          medium: filtered.filter(t => t.priority === 'Medium' || t.priority === 'medium').length,
          low: filtered.filter(t => t.priority === 'Low' || t.priority === 'low').length,
        },
        byStatus: {
          open: filtered.filter(t => t.status === 'Open' || t.status === 'open').length,
          assigned: filtered.filter(t => t.status === 'Assigned' || t.status === 'assigned').length,
          in_progress: filtered.filter(t => t.status === 'In_Progress' || t.status === 'in_progress' || t.status === 'In Progress').length,
          closed: filtered.filter(t => t.status === 'Closed' || t.status === 'closed').length,
        },
      };

      console.log('Stats data:', statsData);
      setStats(statsData);
      setChartData(generateChartData(filtered, statsData));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (tickets, statsData) => {
    // Priority chart data - keep all categories even if 0
    const priorityData = [
      { name: 'Urgent', value: statsData.byPriority.urgent },
      { name: 'High', value: statsData.byPriority.high },
      { name: 'Medium', value: statsData.byPriority.medium },
      { name: 'Low', value: statsData.byPriority.low },
    ];

    // Status chart data - keep all categories even if 0
    const statusData = [
      { name: 'Open', value: statsData.byStatus.open },
      { name: 'Assigned', value: statsData.byStatus.assigned },
      { name: 'In Progress', value: statsData.byStatus.in_progress },
      { name: 'Closed', value: statsData.byStatus.closed },
    ];

    // Timeline data (last 7 days)
    const timelineData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = tickets.filter(t => {
        const ticketDate = new Date(t.created_at).toLocaleDateString();
        return ticketDate === date.toLocaleDateString();
      }).length;
      timelineData.push({ date: dateStr, count });
    }

    console.log('Chart data generated:', { priorityData, statusData, timelineData });
    return { priorityData, statusData, timelineData };
  };

  const calculateAvgResolution = (tickets) => {
    const closedTickets = tickets.filter(t => (t.status === 'Closed' || t.status === 'closed') && t.closed_at);
    if (closedTickets.length === 0) return 'N/A';

    const totalTime = closedTickets.reduce((sum, t) => {
      const created = new Date(t.created_at);
      const closed = new Date(t.closed_at);
      return sum + (closed - created);
    }, 0);

    const avgMs = totalTime / closedTickets.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));
    return avgHours > 24 ? `${Math.round(avgHours / 24)} days` : `${avgHours} hours`;
  };

  const PRIORITY_COLORS = {
    Urgent: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
  };

  const STATUS_COLORS = {
    Open: '#3b82f6',
    Assigned: '#8b5cf6',
    'In Progress': '#06b6d4',
    Closed: '#10b981',
  };

  return (
    <div className="reports-container">
      <Sidebar isAdmin={true} />
      <div className="reports-content">
        <h1>Reports & Analytics</h1>

        <div className="filter-section">
          <label>Time Period:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          {loading && <span className="loading-indicator">Updating...</span>}
        </div>

        {loading ? (
          <p>Loading reports...</p>
        ) : stats ? (
          <>
            <div className="reports-grid">
              <div className="stat-card">
                <h3>Total Tickets</h3>
                <p className="stat-value">{stats.total}</p>
              </div>

              <div className="stat-card">
                <h3>Open Tickets</h3>
                <p className="stat-value">{stats.open}</p>
              </div>

              <div className="stat-card">
                <h3>Closed Tickets</h3>
                <p className="stat-value">{stats.closed}</p>
              </div>

              <div className="stat-card highlight">
                <h3>Urgent Tickets</h3>
                <p className="stat-value">{stats.urgent}</p>
              </div>

              <div className="stat-card">
                <h3>Avg Resolution Time</h3>
                <p className="stat-value">{stats.avgResolutionTime}</p>
              </div>

              <div className="stat-card">
                <h3>Closure Rate</h3>
                <p className="stat-value">
                  {stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="charts-section">
              <div className="chart-container">
                <h2>Tickets by Priority</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h2>Tickets by Status</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container full-width">
                <h2>Tickets Created (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="reports-grid">
              <div className="breakdown-card">
                <h3>By Priority</h3>
                <ul>
                  <li>Urgent: <strong>{stats.byPriority.urgent}</strong></li>
                  <li>High: <strong>{stats.byPriority.high}</strong></li>
                  <li>Medium: <strong>{stats.byPriority.medium}</strong></li>
                  <li>Low: <strong>{stats.byPriority.low}</strong></li>
                </ul>
              </div>

              <div className="breakdown-card">
                <h3>By Status</h3>
                <ul>
                  <li>Open: <strong>{stats.byStatus.open}</strong></li>
                  <li>Assigned: <strong>{stats.byStatus.assigned}</strong></li>
                  <li>In Progress: <strong>{stats.byStatus.in_progress}</strong></li>
                  <li>Closed: <strong>{stats.byStatus.closed}</strong></li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
}

export default Reports;
