import api from './axiosClient.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const userApi = {
  getUsers: () => api.get('/users'),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getUserProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const chatApi = {
  getChats: () => api.get('/chats'),
  getOrCreateChat: (targetUserId) => api.post('/chats', { targetUserId }),
  createGroupChat: (data) => api.post('/chats/group', data),
  getChatById: (id) => api.get(`/chats/${id}`),
};

export const messageApi = {
  getMessages: (chatId, params) => api.get(`/messages/${chatId}`, { params }),
  sendMessage: (formData) => api.post('/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addReaction: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};
