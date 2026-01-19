import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    department: '',
    phone: ''
  });
  const { login, setUserFromToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Register new user
        const response = await api.register({
          email,
          password,
          name: registerData.name,
          department: registerData.department,
          phone: registerData.phone
        });
        const { token, user } = response.data;
        setUserFromToken(token, user);
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      } else {
        // Login existing user
        const result = await login(email, password);
        if (result.success) {
          navigate(result.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo">
          <div className="logo-icon">◆</div>
          <span>IT Support Portal</span>
        </div>
      </div>

      <div className="login-content">
        <div className="login-left">
          <div className="welcome-overlay">
            <h1>Welcome to IT Support Portal</h1>
            <p>Your central hub for technical assistance and support.</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <h2>{isRegistering ? 'Create Account' : 'Staff Login'}</h2>
            <p className="login-subtitle">
              {isRegistering 
                ? 'Please enter your details to create a new account.' 
                : 'Please enter your details to sign in to your account.'}
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      style={{ paddingLeft: '38px' }}
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isRegistering && (
                <>
                  <div className="form-group">
                    <label>Department (Optional)</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🏢</span>
                      <input
                        type="text"
                        placeholder="Enter your department"
                        value={registerData.department}
                        onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone (Optional)</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📞</span>
                      <input
                        type="text"
                        placeholder="Enter your phone number"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegistering ? 'Create a password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isRegistering ? 6 : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              </div>

              {!isRegistering && (
                <div className="form-footer">
                  <a href="#" className="forgot-password">Forgot Password?</a>
                </div>
              )}

              <button type="submit" className="login-button" disabled={loading}>
                {loading 
                  ? (isRegistering ? 'Creating account...' : 'Signing in...') 
                  : (isRegistering ? 'Create Account' : 'Sign In to Your Account')}
              </button>

              <div className="toggle-form">
                {isRegistering ? (
                  <p>
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); setError(''); }}>
                      Sign in
                    </a>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); setError(''); }}>
                      Create one
                    </a>
                  </p>
                )}
              </div>

              <div className="security-message">
                <span>🛡️</span> All connections are secure and encrypted.
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="login-footer">
        <a href="#">Home</a>
        <span>•</span>
        <a href="#">IT Helpdesk Contact</a>
        <span>•</span>
        <a href="#">Terms of Service</a>
      </div>
    </div>
  );
}

export default Login;
