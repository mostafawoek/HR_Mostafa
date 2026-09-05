const request = async (url, options = {}) => {
  const response = await fetch(url, options);
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : null;
  if (!response.ok) { const error = new Error(body?.message || 'Request failed'); error.status = response.status; throw error; }
  return body;
};
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const entity = name => name === 'User' ? {
  list: () => request('/api/users'),
      update: (id, data) => request(`/api/users/${id}`, json('PATCH', { ...data, ...(data.role ? { role: data.role === 'admin' ? 'admin' : 'employee' } : {}) })),
      create: data => request('/api/users', json('POST', data)),
  delete: id => request(`/api/users/${id}`, { method: 'DELETE' }),
} : {
  list: (order, limit) => request(`/api/entities/${name}?order=${encodeURIComponent(order || 'created_at')}&limit=${limit || 500}`),
  create: data => request(`/api/entities/${name}`, json('POST', data)),
  update: (id, data) => request(`/api/entities/${name}/${id}`, json('PATCH', data)),
  delete: id => request(`/api/entities/${name}/${id}`, { method: 'DELETE' }),
};
export const base44 = {
  entities: Object.fromEntries(['Attendance','Employee','Leave','Warning','Document','Department','Performance','Task','Salary','User'].map(name => [name, entity(name)])),
  auth: {
    me: () => request('/api/auth/me'),
    loginViaEmailPassword: async (email, password) => (await request('/api/auth/login', json('POST', { email, password }))).user,
    register: async ({ email, password, name = '' }) => (await request('/api/auth/register', json('POST', { email, password, name }))).user,
    logout: async () => { await request('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; },
    redirectToLogin: () => { window.location.href = '/login'; },
    loginWithProvider: () => { throw new Error('Google login is not configured. Use email and password.'); },
  },
  users: { inviteUser: (email, role = 'user', name = '', password) => request('/api/users', json('POST', { email, role: role === 'admin' ? 'admin' : 'employee', name, password })) },
  integrations: { Core: { UploadFile: async ({ file }) => { const form = new FormData(); form.append('file', file); return request('/api/entities/Document/upload', { method: 'POST', body: form }); } } }
};
