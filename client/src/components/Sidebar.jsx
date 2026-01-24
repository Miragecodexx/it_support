import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Sidebar.css';

function Sidebar({ isAdmin = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tickets', label: 'My Tickets', icon: '🎫' },
    { path: '/submit', label: 'Submit Request', icon: '➕' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/admin/staff', label: 'Staff Management', icon: '👥' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      <div className="topbar">
        <button className="hamburger" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>☰</button>
        <div className="topbar-title">IT Support Portal</div>
      </div>

      <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">◆</div>
          <div>
            <div className="logo-title">IT Support Portal</div>
            <div className="logo-subtitle">Help Desk</div>
          </div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{isAdmin ? 'Admin' : 'IT Support'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          <span>🚪</span> Logout
        </button>
      </div>
      </div>

      {drawerOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true">
          <div className="drawer-content">
            <div className="drawer-header">
              <div className="logo-title">IT Support Portal</div>
              <button className="drawer-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <nav className="drawer-nav">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="drawer-footer">
              <button onClick={() => { setDrawerOpen(false); logout(); }} className="logout-button">Logout</button>
            </div>
          </div>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </>
  );
}

export default Sidebar;
