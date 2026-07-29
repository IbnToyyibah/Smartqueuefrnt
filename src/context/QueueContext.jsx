import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { queueApi, branchApi, counterApi } from '../lib/api'
import { getSocket, joinBranch, leaveBranch } from '../lib/socket'
import { useAuth } from './AuthContext'

const QueueContext = createContext(null)

export const SERVICE_TYPES = [
  { id: 'general', label: 'General Inquiry', duration: 8, color: 'blue' },
  { id: 'account', label: 'Account Services', duration: 12, color: 'purple' },
  { id: 'loans', label: 'Loans & Credit', duration: 20, color: 'orange' },
  { id: 'consultation', label: 'Medical Consultation', duration: 15, color: 'green' },
  { id: 'document', label: 'Document Processing', duration: 10, color: 'yellow' },
  { id: 'complaints', label: 'Complaints & Feedback', duration: 10, color: 'red' },
]

export function QueueProvider({ children }) {
  const { user } = useAuth()

  const [branches, setBranches] = useState([])
  const [queue, setQueue] = useState([])
  const [counters, setCounters] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [activeBranch, setActiveBranch] = useState(null)
  const [stats, setStats] = useState({ totalServed: 0, avgWaitTime: 0, noShowRate: 0, peakHour: '—' })
  const [loading, setLoading] = useState(false)

  /* ── Load public branches on mount ── */
  useEffect(() => {
    branchApi.list()
      .then(({ branches: b }) => { if (b?.length) setBranches(b) })
      .catch(console.error)
  }, [])

  /* ── Load customer's active ticket on login ── */
  useEffect(() => {
    if (user?.role === 'customer') {
      queueApi.myTicket()
        .then(({ ticket }) => { if (ticket) setActiveTicket(ticket) })
        .catch(console.error)
    }
  }, [user])

  /* ── Join branch socket room when activeBranch changes ── */
  useEffect(() => {
    const sock = getSocket()
    if (!sock || !activeBranch) return
    joinBranch(activeBranch)
    return () => leaveBranch(activeBranch)
  }, [activeBranch])

  /* ── Load branch queue + counters for staff/admin ── */
  const loadBranchData = useCallback(async (branchId) => {
    if (!branchId) return
    setLoading(true)
    setActiveBranch(branchId)
    try {
      const [{ tickets }, { counters: c }] = await Promise.all([
        queueApi.branchQueue(branchId),
        counterApi.list(branchId),
      ])
      setQueue(tickets)
      setCounters(c)
    } catch (err) {
      console.error('loadBranchData:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Socket.IO real-time listeners ── */
  useEffect(() => {
    const sock = getSocket()
    if (!sock) return

    const refresh = (ticket) => {
      setQueue((prev) => {
        const idx = prev.findIndex((t) => t._id === ticket._id)
        if (idx === -1) return [ticket, ...prev]
        const next = [...prev]
        next[idx] = ticket
        return next
      })
      setActiveTicket((at) => (at?._id === ticket._id ? ticket : at))
    }

    sock.on('queue:joined', refresh)
    sock.on('queue:called', refresh)
    sock.on('queue:served', refresh)
    sock.on('queue:noshow', refresh)
    sock.on('queue:transferred', refresh)
    sock.on('counter:updated', (counter) => {
      setCounters((prev) => {
        const idx = prev.findIndex((c) => c._id === counter._id)
        if (idx === -1) return [...prev, counter]
        const next = [...prev]
        next[idx] = counter
        return next
      })
    })

    return () => {
      sock.off('queue:joined')
      sock.off('queue:called')
      sock.off('queue:served')
      sock.off('queue:noshow')
      sock.off('queue:transferred')
      sock.off('counter:updated')
    }
  }, [])

  /* ── Customer: join queue (no auth required) ── */
  const joinQueue = useCallback(async (data) => {
    const { ticket } = await queueApi.join(data)
    setActiveTicket(ticket)
    setActiveBranch(ticket.branch?._id || ticket.branch)
    return ticket
  }, [])

  /* ── Staff: call next ── */
  const callNext = useCallback(async (counterId) => {
    const branchId = activeBranch || user?.branch?._id || user?.branch
    if (!branchId) return null
    const next = queue.find(t => ['waiting', 'checked_in'].includes(t.status))
    if (!next) return null
    const { ticket } = await queueApi.callNext(next._id, { counterId })
    return ticket
  }, [queue, activeBranch, user])

  /* ── Staff: mark served ── */
  const markServed = useCallback(async (ticketId, counterId) => {
    const { ticket } = await queueApi.serve(ticketId, { counterId })
    return ticket
  }, [])

  /* ── Staff: mark no-show ── */
  const markNoShow = useCallback(async (ticketId, counterId) => {
    const { ticket } = await queueApi.noShow(ticketId, { counterId })
    return ticket
  }, [])

  /* ── Staff: toggle counter ── */
  const toggleCounter = useCallback(async (counterId) => {
    const { counter } = await counterApi.toggle(counterId)
    setCounters((prev) => prev.map((c) => c._id === counter._id ? counter : c))
    return counter
  }, [])

  /* ── Staff: transfer ── */
  const transferTicket = useCallback(async (ticketId, toCounterId) => {
    const { ticket } = await queueApi.transfer(ticketId, { toCounterId })
    return ticket
  }, [])

  const waitingCount = queue.filter(t => t.status === 'waiting').length
  const servingCount = queue.filter(t => ['called', 'serving'].includes(t.status)).length

  return (
    <QueueContext.Provider value={{
      queue, counters, branches, activeTicket, activeBranch,
      stats, loading, waitingCount, servingCount,
      joinQueue, callNext, markServed, markNoShow,
      toggleCounter, transferTicket,
      loadBranchData, setActiveTicket,
      SERVICE_TYPES,
      BRANCHES: branches,
    }}>
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider')
  return ctx
}
