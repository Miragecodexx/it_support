import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Auth
  login: (email, password) => axios.post(`${API_BASE}/auth/login`, { email, password }),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data),
  verify: () => axios.get(`${API_BASE}/auth/verify`),

  // Tickets
  getTickets: (params) => axios.get(`${API_BASE}/tickets`, { params }),
  getTicket: (id) => axios.get(`${API_BASE}/tickets/${id}`),
  deleteTicket: (id) => axios.delete(`${API_BASE}/tickets/${id}`),
  createTicket: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'attachments') {
        data[key].forEach(file => formData.append('attachments', file));
      } else {
        formData.append(key, data[key]);
      }
    });
    return axios.post(`${API_BASE}/tickets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateTicket: (id, data) => axios.put(`${API_BASE}/tickets/${id}`, data),
  addReply: (id, message, isInternal, attachments = []) => {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('is_internal', isInternal);
    attachments.forEach(file => formData.append('attachments', file));
    return axios.post(`${API_BASE}/tickets/${id}/conversations`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getStats: () => axios.get(`${API_BASE}/tickets/stats/dashboard`),

  // Users
  getUsers: () => axios.get(`${API_BASE}/users`),
  getUser: (id) => axios.get(`${API_BASE}/users/${id}`),
  createUser: (data) => axios.post(`${API_BASE}/users`, data),
  updateUser: (id, data) => axios.put(`${API_BASE}/users/${id}`, data),
};

export default api;
