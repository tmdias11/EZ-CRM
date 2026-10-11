async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('activeClubId') ? { 'X-Club-Id': localStorage.getItem('activeClubId') } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Произошла ошибка');
  }

  return data;
}

export const api = {

  // =====================================================
  // AUTH
  // =====================================================

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


  // =====================================================
  // CLIENTS
  // =====================================================

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


  // =====================================================
  // PROFILE
  // =====================================================

  profile: () =>
    request('/api/auth/me'),

  updateProfile: (body) =>
    request('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(body)
    }),


  // =====================================================
  // TASKS
  // =====================================================

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


  // =====================================================
  // CLUBS
  // =====================================================
  clubs: () => request('/api/clubs'),
  createClub: (body) => request('/api/clubs', { method: 'POST', body: JSON.stringify(body) }),
  searchClubUsers: (q) => request(`/api/clubs/users/search?q=${encodeURIComponent(q)}`),
  addClubManager: (clubId, userId) => request(`/api/clubs/${clubId}/managers`, { method: 'POST', body: JSON.stringify({ userId }) }),
  clubFloor: () => request('/api/club-floor'),
  acceptWalkIn: (id, body) => request(`/api/club-floor/${id}/accept`, { method: 'POST', body: JSON.stringify(body) }),
  rejectWalkIn: (id) => request(`/api/club-floor/${id}/reject`, { method: 'POST' }),
  extendClubClient: (id, body) => request(`/api/club-floor/clients/${id}/extend`, { method: 'POST', body: JSON.stringify(body) }),
  closeClubClient: (id) => request(`/api/club-floor/clients/${id}/close`, { method: 'POST' }),

  // =====================================================
  // ADMIN
  // =====================================================

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