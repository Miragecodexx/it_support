import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import './Settings.css';

function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    siteName: 'IT Support System',
    supportEmail: 'support@company.com',
    maxUploadSize: 5,
    ticketAutoClose: 30,
    notificationsEnabled: true,
    maintenanceMode: false,
  });

  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    toast.success('Settings saved successfully!');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-container">
      <Sidebar isAdmin={true} />
      <div className="settings-content">
        <h1>Settings</h1>

        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>General Settings</h2>
            <div className="setting-field">
              <label>Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
              />
            </div>
            <div className="setting-field">
              <label>Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
              />
            </div>
            <div className="setting-field">
              <label>Max Upload Size (MB)</label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-field">
              <label>Auto-Close Tickets After (days)</label>
              <input
                type="number"
                value={settings.ticketAutoClose}
                onChange={(e) => handleChange('ticketAutoClose', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            <div className="setting-field checkbox">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
              />
              <label>Enable Email Notifications</label>
            </div>
            <p className="info-text">
              When enabled, users will receive email notifications for ticket updates.
            </p>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="settings-section">
            <h2>System Settings</h2>
            <div className="setting-field checkbox">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <label>Maintenance Mode</label>
            </div>
            <p className="info-text">
              {settings.maintenanceMode
                ? 'System is in maintenance mode. Only admins can access the system.'
                : 'System is operating normally.'}
            </p>

            <div className="setting-field">
              <h3>System Info</h3>
              <ul className="info-list">
                <li>Version: 1.0.0</li>
                <li>Database: SQLite</li>
                <li>API: REST</li>
                <li>Real-time: WebSocket (Socket.IO)</li>
              </ul>
            </div>

            <div className="setting-field">
              <h3>Danger Zone</h3>
              <button className="btn-danger" onClick={() => {
                if (window.confirm('Are you sure? This will delete all tickets and cannot be undone.')) {
                  toast.success('Database reset initiated');
                }
              }}>
                Clear All Tickets
              </button>
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {saved && <span className="save-indicator">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

export default Settings;
