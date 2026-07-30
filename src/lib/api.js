/**
 * Centralised API client for SmartQueue.
 * All fetch calls go through here so token injection and error
 * handling live in one place.
 */

const RAW_BASE = import.meta.env.VITE_API_URL
const BASE = RAW_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:5001/api' : '/api')

const getToken = () => localStorage.getItem('sq_token')

const normalizeBranch = (branch) => {
  if (!branch) return branch
  return {
    ...branch,
    _id: branch._id || branch.id,
    id: branch.id || branch._id,
  }
}

const normalizeBranchList = (payload) => {
  if (!payload?.branches) return payload
  return {
    ...payload,
    branches: payload.branches.map(normalizeBranch),
  }
}

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
})

async function request(method, path, body) {
  const opts = {
    method,
    headers: headers(),
    credentials: 'include',
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const patch = (path, body) => request('PATCH', path, body)
const del = (path) => request('DELETE', path)

// Auth
export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  me: () => get('/auth/me'),
  updateMe: (data) => patch('/auth/me', data),
  changePassword: (data) => post('/auth/change-password', data),
}

// Queue
export const queueApi = {
  join: (data) => post('/queue/join', data),
  myTicket: () => get('/queue/my'),
  history: () => get('/queue/history'),
  branchQueue: (id, sts) => get(`/queue/branch/${id}${sts ? `?status=${sts}` : ''}`),
  getTicket: (id) => get(`/queue/${id}`),
  lookup: (ticketNum) => get(`/queue/lookup/${ticketNum}`),
  callNext: (id, body) => post(`/queue/${id}/call`, body),
  serve: (id, body) => post(`/queue/${id}/serve`, body),
  noShow: (id, body) => post(`/queue/${id}/noshow`, body),
  transfer: (id, body) => post(`/queue/${id}/transfer`, body),
  checkin: (id) => post(`/queue/${id}/checkin`),
  skip: (id, body) => post(`/queue/${id}/skip`, body),
  recall: (id) => post(`/queue/${id}/recall`),
  rate: (id, body) => patch(`/queue/${id}/rate`, body),
  stats: (id, days) => get(`/queue/stats/${id}?days=${days || 7}`),
}

// Branches
export const branchApi = {
  list: async () => normalizeBranchList(await get('/branches')),
  get: async (id) => {
    const res = await get(`/branches/${id}`)
    return { ...res, branch: normalizeBranch(res.branch) }
  },
  create: async (data) => {
    const res = await post('/branches', data)
    return { ...res, branch: normalizeBranch(res.branch) }
  },
  update: async (id, data) => {
    const res = await patch(`/branches/${id}`, data)
    return { ...res, branch: normalizeBranch(res.branch) }
  },
  updateSubscription: async (id, data) => {
    const res = await patch(`/branches/${id}/subscription`, data)
    return { ...res, branch: normalizeBranch(res.branch) }
  },
  remove: (id) => del(`/branches/${id}`),
  counters: (id) => get(`/branches/${id}/counters`),
}

// Counters
export const counterApi = {
  list: (branchId) => get(`/counters?branch=${branchId}`),
  create: (data) => post('/counters', data),
  update: (id, data) => patch(`/counters/${id}`, data),
  toggle: (id) => patch(`/counters/${id}/toggle`),
  remove: (id) => del(`/counters/${id}`),
}

// Users
export const userApi = {
  list: (params) => get(`/users?${new URLSearchParams(params || {})}`),
  branch: (id) => get(`/users/branch/${id}`),
  create: (data) => post('/users', data),
  update: (id, data) => patch(`/users/${id}`, data),
  remove: (id) => del(`/users/${id}`),
}

// Notifications
export const notifApi = {
  list: (page) => get(`/notifications?page=${page || 1}`),
  read: (id) => patch(`/notifications/${id}/read`),
  readAll: () => patch('/notifications/read-all'),
  remove: (id) => del(`/notifications/${id}`),
  sendToTicket: (ticketId, data) => post(`/notifications/send-ticket/${ticketId}`, data),
}

// Analytics
export const analyticsApi = {
  branch: (id, days) => get(`/analytics/branch/${id}?days=${days || 7}`),
  platform: (days) => get(`/analytics/platform?days=${days || 7}`),
}

export default { authApi, queueApi, branchApi, counterApi, userApi, notifApi, analyticsApi }
