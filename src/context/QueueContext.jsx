import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { queueApi, branchApi, counterApi, normalizeCounter, mergeTicketUpdate } from '../lib/api'
import { connectSocket, joinBranch, leaveBranch } from '../lib/socket'
import { useAuth } from './AuthContext'
import { SERVICE_TYPES } from '../constants/services'
import { calculateDynamicWaitTime } from '../lib/queueHelpers'
import { sendWebPushNotification } from '../lib/pushNotificationService'

const QueueContext = createContext(null)

const sameId = (a, b) => Boolean(a && b) && String(a._id || a.id) === String(b._id || b.id)

export { SERVICE_TYPES }

export function QueueProvider({ children }) {
  const { user } = useAuth()

  const [branches, setBranches] = useState([])
  const [queue, setQueue] = useState([])
  const [counters, setCounters] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [activeBranch, setActiveBranch] = useState(null)
  const [stats] = useState({ totalServed: 0, avgWaitTime: 0, noShowRate: 0, peakHour: '—' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    branchApi.list()
      .then(({ branches: branchList }) => {
        if (Array.isArray(branchList) && branchList.length > 0) {
          setBranches(branchList)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (user?.role !== 'customer') return

    queueApi.myTicket()
      .then(({ ticket }) => {
        if (ticket) setActiveTicket(ticket)
      })
      .catch(console.error)
  }, [user])

  useEffect(() => {
    if (!activeBranch) return
    const sock = connectSocket()
    const subscribe = () => joinBranch(activeBranch)
    sock.on('connect', subscribe)
    if (sock.connected) subscribe()
    return () => {
      sock.off('connect', subscribe)
      leaveBranch(activeBranch)
    }
  }, [activeBranch, user?._id])

  const mergeTicket = useCallback((update) => {
    const ticket = mergeTicketUpdate(null, update)
    setQueue((prevQueue) => {
      const index = prevQueue.findIndex((item) => sameId(item, ticket))
      if (index === -1) return [ticket, ...prevQueue]
      const next = [...prevQueue]
      next[index] = mergeTicketUpdate(prevQueue[index], update)
      return next
    })

    setActiveTicket((currentTicket) => {
      const isMatch = sameId(currentTicket, ticket)
      if (!isMatch) return currentTicket
      const merged = mergeTicketUpdate(currentTicket, update)

      // Browser push on status change; SMS/email are sent by the server.
      if (ticket.status === 'called' && currentTicket.status !== 'called') {
        sendWebPushNotification(`Ticket #${ticket.ticketNumber} Called!`, {
          body: `Please proceed to ${ticket.counter?.name || ticket.counter || 'your assigned counter'} now.`,
          tag: `called-${ticket._id}`,
        })
      }

      return merged
    })
  }, [])

  const mergeCounter = useCallback((rawCounter) => {
    const counter = normalizeCounter(rawCounter)
    setCounters((prevCounters) => {
      const index = prevCounters.findIndex((item) => sameId(item, counter))
      if (index === -1) return [...prevCounters, counter]
      const next = [...prevCounters]
      next[index] = counter
      return next
    })
  }, [])

  useEffect(() => {
    // Re-run when the user changes: logout tears down the socket and its listeners.
    const sock = connectSocket()

    const handlers = {
      'queue:joined': mergeTicket,
      'queue:called': mergeTicket,
      'queue:served': mergeTicket,
      'queue:noshow': mergeTicket,
      'queue:transferred': mergeTicket,
      'counter:updated': mergeCounter,
    }

    Object.entries(handlers).forEach(([event, handler]) => sock.on(event, handler))
    return () => Object.entries(handlers).forEach(([event, handler]) => sock.off(event, handler))
  }, [mergeTicket, mergeCounter, user?._id])

  const loadBranchData = useCallback(async (branchId) => {
    if (!branchId) return

    setLoading(true)
    setActiveBranch(branchId)

    try {
      const [{ tickets }, { counters: counterList }] = await Promise.all([
        queueApi.branchQueue(branchId),
        counterApi.list(branchId),
      ])
      setQueue(Array.isArray(tickets) ? tickets : [])
      setCounters(Array.isArray(counterList) ? counterList : [])
    } catch (err) {
      console.error('loadBranchData:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const completedTickets = useMemo(() => queue.filter((t) => t.status === 'served'), [queue])

  /* ── Dynamic Moving-Average Wait Time Calculation for Queue ── */
  const queueWithDynamicWait = useMemo(() => {
    return queue.map((ticket) => {
      const dynamicWait = calculateDynamicWaitTime({
        ticket,
        queue,
        counters,
        completedTickets,
        fallbackDuration: ticket.service?.duration || 10,
      })
      return {
        ...ticket,
        estimatedWait: dynamicWait,
        dynamicWait,
      }
    })
  }, [queue, counters, completedTickets])

  /* ── Dynamic Moving-Average Wait Time Calculation for Active Ticket ── */
  const activeTicketWithDynamicWait = useMemo(() => {
    if (!activeTicket) return null
    const dynamicWait = calculateDynamicWaitTime({
      ticket: activeTicket,
      queue,
      counters,
      completedTickets,
      fallbackDuration: activeTicket.service?.duration || 10,
    })
    return {
      ...activeTicket,
      estimatedWait: dynamicWait,
      dynamicWait,
    }
  }, [activeTicket, queue, counters, completedTickets])

  const joinQueue = useCallback(async (data) => {
    const { ticket } = await queueApi.join(data)
    setActiveTicket(ticket)
    setActiveBranch(ticket.branch?._id || ticket.branch)
    return ticket
  }, [])

  const getCurrentBranchId = useCallback(() => activeBranch || user?.branch?._id || user?.branch, [activeBranch, user])

  const callNext = useCallback(async (counterId) => {
    const branchId = getCurrentBranchId()
    if (!branchId) return null

    const nextTicket = queue.find((ticket) => ['waiting', 'checked_in'].includes(ticket.status))
    if (!nextTicket) return null

    const { ticket } = await queueApi.callNext(nextTicket._id, { counter_id: counterId })
    return ticket
  }, [getCurrentBranchId, queue])

  const markServed = useCallback(async (ticketId, counterId) => {
    const { ticket } = await queueApi.serve(ticketId, { counter_id: counterId })
    return ticket
  }, [])

  const markNoShow = useCallback(async (ticketId, counterId) => {
    const { ticket } = await queueApi.noShow(ticketId, { counter_id: counterId })
    return ticket
  }, [])

  const toggleCounter = useCallback(async (counterId) => {
    const { counter } = await counterApi.toggle(counterId)
    setCounters((prev) => prev.map((item) => (sameId(item, counter) ? counter : item)))
    return counter
  }, [])

  const transferTicket = useCallback(async (ticketId, toCounterId) => {
    const { ticket } = await queueApi.transfer(ticketId, { to_counter_id: toCounterId })
    return ticket
  }, [])

  const waitingCount = useMemo(() => queueWithDynamicWait.filter((ticket) => ticket.status === 'waiting').length, [queueWithDynamicWait])
  const servingCount = useMemo(() => queueWithDynamicWait.filter((ticket) => ['called', 'serving'].includes(ticket.status)).length, [queueWithDynamicWait])

  return (
    <QueueContext.Provider
      value={{
        queue: queueWithDynamicWait,
        counters,
        branches,
        activeTicket: activeTicketWithDynamicWait,
        activeBranch,
        stats,
        loading,
        waitingCount,
        servingCount,
        joinQueue,
        callNext,
        markServed,
        markNoShow,
        toggleCounter,
        transferTicket,
        loadBranchData,
        setActiveTicket,
        SERVICE_TYPES,
        BRANCHES: branches,
      }}
    >
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider')
  return ctx
}
