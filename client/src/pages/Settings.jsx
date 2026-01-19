import Sidebar from '../components/Sidebar';
import './Settings.css';

function Settings() {
  return (
    <div className="settings-container">
      <Sidebar isAdmin={true} />
      <div className="settings-content">
        <h1>Settings</h1>
        <p>Settings functionality coming soon...</p>
      </div>
    </div>
  );
}

export default Settings;
