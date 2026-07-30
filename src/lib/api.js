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

const toSnakeCaseQueueJoin = (data = {}) => ({
  branch_id: data.branch_id || data.branchId || '',
  service_id: data.service_id || data.serviceId || '',
  time_slot: data.time_slot || data.timeSlot || '',
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  notify_channel: data.notify_channel || data.notifyChannel || 'both',
})

const normalizeTicket = (ticket) => {
  if (!ticket) return ticket
  return {
    ...ticket,
    _id: ticket._id || ticket.id,
    id: ticket.id || ticket._id,
    ticketNumber: ticket.ticketNumber || ticket.ticket_number,
    ticket_number: ticket.ticket_number || ticket.ticketNumber,
    estimatedWait: ticket.estimatedWait || ticket.estimated_wait,
    estimated_wait: ticket.estimated_wait || ticket.estimatedWait,
    qrCode: ticket.qrCode || ticket.qr_code,
    qr_code: ticket.qr_code || ticket.qrCode,
    notifyChannel: ticket.notifyChannel || ticket.notify_channel,
    notify_channel: ticket.notify_channel || ticket.notifyChannel,
  }
}

const normalizeTicketPayload = (payload) => {
  if (!payload?.ticket) return payload
  return {
    ...payload,
    ticket: normalizeTicket(payload.ticket),
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
  join: async (data) => normalizeTicketPayload(await post('/queue/join', toSnakeCaseQueueJoin(data))),
  myTicket: async () => normalizeTicketPayload(await get('/queue/my')),
  history: async () => {
    const res = await get('/queue/history')
    return {
      ...res,
      tickets: Array.isArray(res.tickets) ? res.tickets.map(normalizeTicket) : res.tickets,
    }
  },
  branchQueue: async (id, sts) => {
    const res = await get(`/queue/branch/${id}${sts ? `?status=${sts}` : ''}`)
    return {
      ...res,
      tickets: Array.isArray(res.tickets) ? res.tickets.map(normalizeTicket) : res.tickets,
    }
  },
  getTicket: async (id) => normalizeTicketPayload(await get(`/queue/${id}`)),
  lookup: async (ticketNum) => normalizeTicketPayload(await get(`/queue/lookup/${ticketNum}`)),
  callNext: async (id, body) => normalizeTicketPayload(await post(`/queue/${id}/call`, body)),
  serve: async (id, body) => normalizeTicketPayload(await post(`/queue/${id}/serve`, body)),
  noShow: async (id, body) => normalizeTicketPayload(await post(`/queue/${id}/noshow`, body)),
  transfer: async (id, body) => normalizeTicketPayload(await post(`/queue/${id}/transfer`, body)),
  checkin: async (id) => normalizeTicketPayload(await post(`/queue/${id}/checkin`)),
  skip: async (id, body) => normalizeTicketPayload(await post(`/queue/${id}/skip`, body)),
  recall: async (id) => normalizeTicketPayload(await post(`/queue/${id}/recall`)),
  rate: async (id, body) => normalizeTicketPayload(await patch(`/queue/${id}/rate`, body)),
  stats: (id, days) => get(`/queue/stats/${id}?days=${days || 7}`),
}

// Branches
export const branchApi = {
  list: async () => normalizeBranchList(await get('/branches')),
  get: async (id) => {
    const res = await get(`/branches/${id}`)
    return { ...res, branch: normalizeBranch(res.branch) }
  },
  getServices: async (id) => {
    const res = await get(`/branches/${id}/services`)
    return {
      ...res,
      services: Array.isArray(res.services)
        ? res.services.map((service) => ({ ...service, id: service.id || service._id }))
        : res.services,
    }
  },
  createService: async (branchId, data) => {
    const res = await post(`/branches/${branchId}/services`, data)
    return { ...res, service: { ...res.service, id: res.service?.id || res.service?._id } }
  },
  updateService: async (serviceId, data) => {
    const res = await patch(`/branches/services/${serviceId}`, data)
    return { ...res, service: { ...res.service, id: res.service?.id || res.service?._id } }
  },
  removeService: (serviceId) => del(`/branches/services/${serviceId}`),
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
