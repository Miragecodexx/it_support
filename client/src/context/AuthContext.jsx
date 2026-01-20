import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/auth/verify');
      setUser(response.data.user);
      connectSocket(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      connectSocket(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const connectSocket = (user) => {
    try {
      // default to server on port 5000 if not provided
      const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
      const s = io(serverUrl, { transports: ['websocket', 'polling'] });
      s.on('connect', () => {
        s.emit('join', { userId: user.id, role: user.role });
      });

      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        try { Notification.requestPermission(); } catch (e) {}
      }

      s.on('ticket_created', (data) => {
        const body = data.subject || 'A new ticket was created';
        toast.info(`New ticket ${data.ticketId}: ${body}`);
      });

      s.on('ticket_reply', (data) => {
        const body = `${data.from || 'Someone'}: ${data.message}`;
        toast.info(`Update on ${data.ticketId}: ${body}`);
      });

      setSocket(s);
    } catch (e) {
      console.error('Socket connection failed', e);
    }
  };

  const setUserFromToken = (token, user) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    connectSocket(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};
