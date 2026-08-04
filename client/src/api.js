const BASE = import.meta.env.VITE_API_BASE || '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  };
}

async function handleResponse(res) {
  const text = await res.text();
  if (!text) throw new Error('Empty response from server');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Server returned an unexpected response. Is the server running?');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) =>
    fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),

  login: (body) =>
    fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),

  me: () =>
    fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handleResponse),

  adminLogin: (body) =>
    fetch(`${BASE}/auth/admin-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),

  updateProfile: (body) =>
    fetch(`${BASE}/auth/profile`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  changePassword: (body) =>
    fetch(`${BASE}/auth/password`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  // Guruvandan logs
  getGuruvandanLogs: (date) =>
    fetch(`${BASE}/guruvandan/logs${date ? `?date=${date}` : ''}`, { headers: authHeaders() }).then(handleResponse),

  logGuruvandan: (body) =>
    fetch(`${BASE}/guruvandan/log`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  deleteGuruvandanLog: (date) =>
    fetch(`${BASE}/guruvandan/log/${date}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),

  getSummary: () =>
    fetch(`${BASE}/guruvandan/summary`, { headers: authHeaders() }).then(handleResponse),

  // Leaderboard
  getLeaderboard: () =>
    fetch(`${BASE}/leaderboard`).then(handleResponse),

  // Payment
  createOrder: () =>
    fetch(`${BASE}/payment/create-order`, { method: 'POST', headers: authHeaders() }).then(handleResponse),

  verifyPayment: (body) =>
    fetch(`${BASE}/payment/verify`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  // Admin
  getAdminUsers: (deleted = false, disqualified = false) =>
    fetch(`${BASE}/admin/users${deleted ? '?deleted=1' : disqualified ? '?disqualified=1' : ''}`, { headers: authHeaders() }).then(handleResponse),

  deleteUser: (id, is_deleted) =>
    fetch(`${BASE}/admin/users/${id}/delete`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ is_deleted }) }).then(handleResponse),

  setFeePaid: (id, paid) =>
    fetch(`${BASE}/admin/users/${id}/fee`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ paid }) }).then(handleResponse),

  setAdmin: (id, is_admin) =>
    fetch(`${BASE}/admin/users/${id}/admin`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ is_admin }) }).then(handleResponse),

  disqualifyUser: (id, is_disqualified) =>
    fetch(`${BASE}/admin/users/${id}/disqualify`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ is_disqualified }) }).then(handleResponse),

  getUserSummary: (id) =>
    fetch(`${BASE}/admin/users/${id}/summary`, { headers: authHeaders() }).then(handleResponse),

  getUserLogs: (id) =>
    fetch(`${BASE}/admin/users/${id}/logs`, { headers: authHeaders() }).then(handleResponse),

  resetUserPassword: (id, password) =>
    fetch(`${BASE}/admin/users/${id}/password`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ password }) }).then(handleResponse),

  getLandingVideo: () =>
    fetch(`${BASE}/settings/landing-video`).then(handleResponse),

  uploadLandingVideo: (formData) =>
    fetch(`${BASE}/admin/settings/upload-video`, { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${getToken()}` }, // Do NOT set Content-Type, browser will set it with boundary for FormData
      body: formData 
    }).then(handleResponse),

  removeLandingVideo: () =>
    fetch(`${BASE}/admin/settings/remove-video`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),

  forgotPassword: (email) =>
    fetch(`${BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(handleResponse),

  resetPassword: (token, password) =>
    fetch(`${BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }).then(handleResponse),
};
