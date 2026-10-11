const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('activeClubId')
        ? { 'X-Club-Id': localStorage.getItem('activeClubId') }
        : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Произошла ошибка');
  }

  return data;
}

export const api = {
  register: (body) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: (body) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  logout: () =>
    request('/api/auth/logout', {
      method: 'POST'
    }),

  me: () =>
    request('/api/auth/me'),

  clients: () =>
    request('/api/clients'),

  myClients: () =>
    request('/api/my/clients'),

  client: (id) =>
    request(`/api/clients/${id}`),

  createClient: (body) =>
    request('/api/clients', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  updateClient: (id, body) =>
    request(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  deleteClient: (id) =>
    request(`/api/clients/${id}`, {
      method: 'DELETE'
    }),

  profile: () =>
    request('/api/auth/me'),

  updateProfile: (body) =>
    request('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  tasks: () =>
    request('/api/tasks'),

  task: (id) =>
    request(`/api/tasks/${id}`),

  createTask: (body) =>
    request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  updateTask: (id, body) =>
    request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  deleteTask: (id) =>
    request(`/api/tasks/${id}`, {
      method: 'DELETE'
    }),

  clubs: () =>
    request('/api/clubs'),

  createClub: (body) =>
    request('/api/clubs', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  searchClubUsers: (q) =>
    request(`/api/clubs/users/search?q=${encodeURIComponent(q)}`),

  addClubManager: (clubId, userId) =>
    request(`/api/clubs/${clubId}/managers`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),

  clubFloor: () =>
    request('/api/club-floor'),

  acceptWalkIn: (id, body) =>
    request(`/api/club-floor/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  rejectWalkIn: (id) =>
    request(`/api/club-floor/${id}/reject`, {
      method: 'POST'
    }),

  extendClubClient: (id, body) =>
    request(`/api/club-floor/clients/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  closeClubClient: (id) =>
    request(`/api/club-floor/clients/${id}/close`, {
      method: 'POST'
    }),

  adminUsers: () =>
    request('/api/admin/users'),

  adminStats: () =>
    request('/api/admin/stats'),

  adminClub: () =>
    request('/api/admin/club'),

  updateAdminClub: (body) =>
    request('/api/admin/club', {
      method: 'PUT',
      body: JSON.stringify(body)
    })
};