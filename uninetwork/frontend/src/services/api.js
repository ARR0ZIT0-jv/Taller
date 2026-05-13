const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('uninetwork_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (!data) throw new Error('Error de red o el servidor no devolvió JSON válido.');
    throw new Error(data.error || data.errorMessage || data.message || JSON.stringify(data));
  }
  return data;
}

// Auth
export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
};

// Posts
export const postsApi = {
  getFeed: (page = 1) => request(`/posts/feed?page=${page}`),
  create: (content) => request('/posts', { method: 'POST', body: JSON.stringify({ content }) }),
  getComments: (postId) => request(`/posts/${postId}/comments`),
  addComment: (postId, content) => request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  toggleLike: (postId) => request(`/posts/${postId}/like`, { method: 'POST' }),
  delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
};

// Careers
export const careersApi = {
  search: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/careers/search?${qs}`);
  },
  getById: (id) => request(`/careers/${id}`),
  getFaculties: () => request('/careers/faculties'),
  getCountries: () => request('/careers/countries'),
};

// Universities
export const universitiesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/universities?${qs}`);
  },
  getById: (id) => request(`/universities/${id}`),
};

// Profile
export const profileApi = {
  get: (userId) => request(`/profile/${userId}`),
  update: (data) => request('/profile/me', { method: 'PUT', body: JSON.stringify(data) }),
  connect: (userId) => request(`/profile/${userId}/connect`, { method: 'POST' }),
  getConnections: () => request('/profile/connections'),
  getSuggestions: () => request('/profile/suggestions'),
};

// Vocational Test
export const vocationalApi = {
  getQuestions: () => request('/vocational/questions'),
  submit: (answers) => request('/vocational/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
  getResults: () => request('/vocational/results'),
  getLatest: () => request('/vocational/results/latest'),
};
