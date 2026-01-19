import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './SubmitRequest.css';

function SubmitRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    category: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        attachments
      };
      const response = await api.createTicket(data);
      navigate(`/ticket/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-container">
      <Sidebar />
      <div className="submit-content">
        <h1>Submit a New Support Request</h1>
        <p className="submit-subtitle">Please provide as much detail as possible so we can resolve your issue quickly.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="submit-form">
          <div className="form-section">
            <h2>User Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Reporter's Name</label>
                <input type="text" value={user?.name || ''} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={user?.department || 'N/A'} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input type="email" value={user?.email || ''} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="text" value={user?.phone || 'N/A'} disabled className="disabled-input" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Issue Details</h2>
            <div className="form-group">
              <label>Ticket Summary</label>
              <input
                type="text"
                name="subject"
                placeholder="e.g., Cannot connect to the office Wi-Fi"
                value={formData.subject}
                onChange={handleChange}
                required
              />
              <small>Provide a short, one-line summary of the problem.</small>
            </div>

            <div className="form-group">
              <label>Detailed Description</label>
              <textarea
                name="description"
                rows="8"
                placeholder="Please provide a detailed description of the issue, including any error messages, steps to reproduce, and what you've already tried..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select Category</option>
                  <option value="Network">Network</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Email">Email</option>
                  <option value="Account">Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Attachments (Optional)</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              {attachments.length > 0 && (
                <div className="file-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="file-item">
                      <span>📎</span> {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitRequest;
