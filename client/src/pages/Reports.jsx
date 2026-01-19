import Sidebar from '../components/Sidebar';
import './Reports.css';

function Reports() {
  return (
    <div className="reports-container">
      <Sidebar isAdmin={true} />
      <div className="reports-content">
        <h1>Reports</h1>
        <p>Reports functionality coming soon...</p>
      </div>
    </div>
  );
}

export default Reports;
