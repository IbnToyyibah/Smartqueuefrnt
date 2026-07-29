/**
 * QueueDisplay — public real-time board (queue / queue2 / queue3 / queue4)
 * Each page locks to one branch and shows the live queue with
 * Framer Motion animated ticket cards.
 *
 * Routes:
 *   /queue  → branchIndex 0  (Lagos Main Branch)
 *   /queue2 → branchIndex 1  (Abuja Central Office)
 *   /queue3 → branchIndex 2  (Port Harcourt Branch)
 *   /queue4 → branchIndex 3  (Kano State Office)
 */
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAccessTime, MdPeople, MdDashboard,
  MdCheckCircle, MdVolumeUp, MdCircle,
} from 'react-icons/md'
import { branchApi, queueApi } from '../../lib/api'
import { connectSocket, joinBranch } from '../../lib/socket'
import Badge from '../../components/ui/Badge'
import AnimatedQueueBackground from '../../components/ui/AnimatedQueueBackground'

/* ── helpers ── */
function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-sm text-slate-400">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

/* Animated ticket row */
function TicketRow({ ticket, index }) {
  const statusCfg = {
    waiting: { ring: 'border-slate-200', dot: 'bg-amber-400',  label: 'Waiting'  },
    called:  { ring: 'border-blue-400',  dot: 'bg-blue-500 animate-ping', label: 'Called' },
    serving: { ring: 'border-indigo-400',dot: 'bg-indigo-500', label: 'Serving'  },
  }
  const cfg = statusCfg[ticket.status] ?? statusCfg.waiting

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30, scale: 0.97 }}
      animate={{ opacity: 1, x: 0,   scale: 1     }}
      exit={{    opacity: 0, x:  30, scale: 0.97  }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: index * 0.04 }}
      className={`flex items-center gap-4 bg-white rounded-2xl border-2 px-5 py-4 ${cfg.ring}`}
    >
      {/* position number */}
      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
        {ticket.position}
      </div>

      {/* ticket + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-base">{ticket.ticketNumber}</span>
          {ticket.status === 'called' && (
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"
            >
              📢 CALLED
            </motion.span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">{ticket.name} · {ticket.service?.label}</p>
      </div>

      {/* wait */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-xs text-slate-400">Est. wait</p>
        <p className="text-sm font-bold text-slate-700">{ticket.estimatedWait} min</p>
      </div>

      {/* counter */}
      {ticket.counter && (
        <div className="shrink-0 hidden md:block">
          <Badge variant="info" size="sm">{ticket.counter?.name || ticket.counter}</Badge>
        </div>
      )}

      {/* status dot */}
      <span className="relative flex h-3 w-3 shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`} />
        <span className={`relative inline-flex rounded-full h-3 w-3 ${cfg.dot.replace(' animate-ping','')}`} />
      </span>
    </motion.div>
  )
}

/* Now-serving spotlight */
function NowServing({ tickets }) {
  const serving = tickets.filter((t) => ['called','serving'].includes(t.status))
  if (serving.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Now Serving
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {serving.map((t) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{    opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
                  {t.counter?.name || 'Counter'}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                >
                  <MdVolumeUp size={18} className="text-indigo-200" />
                </motion.span>
              </div>
              <p className="text-4xl font-extrabold tracking-tight">{t.ticketNumber}</p>
              <p className="text-sm text-indigo-200 mt-1 truncate">{t.name}</p>
              <p className="text-xs text-indigo-300 mt-0.5">{t.service?.label}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function QueueDisplay({ branchIndex = 0 }) {
  const [branch,  setBranch]  = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  /* ── Fetch initial data ── */
  useEffect(() => {
    let branchId = null

    branchApi.list()
      .then(({ branches }) => {
        const b = branches[branchIndex]
        if (!b) return
        setBranch(b)
        branchId = b._id

        return queueApi.branchQueue(b._id)
      })
      .then((data) => {
        if (data?.tickets) {
          setTickets(data.tickets.filter((t) => ['waiting','called','serving'].includes(t.status)))
          setLastUpdate(new Date())
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [branchIndex])

  /* ── Socket.IO real-time updates ── */
  useEffect(() => {
    if (!branch?._id) return

    // Connect as unauthenticated public display
    const sock = connectSocket('')
    joinBranch(branch._id)

    const refresh = (ticket) => {
      setLastUpdate(new Date())
      setTickets((prev) => {
        const active = ['waiting','called','serving']
        if (!active.includes(ticket.status)) {
          // Remove ticket that left the active queue
          return prev.filter((t) => t._id !== ticket._id)
        }
        const idx = prev.findIndex((t) => t._id === ticket._id)
        if (idx === -1) return [...prev, ticket].sort((a,b) => a.position - b.position)
        const next = [...prev]
        next[idx] = ticket
        return next.sort((a,b) => a.position - b.position)
      })
    }

    sock.on('queue:joined',      refresh)
    sock.on('queue:called',      refresh)
    sock.on('queue:served',      refresh)
    sock.on('queue:noshow',      refresh)
    sock.on('queue:transferred', refresh)

    return () => {
      sock.off('queue:joined')
      sock.off('queue:called')
      sock.off('queue:served')
      sock.off('queue:noshow')
      sock.off('queue:transferred')
    }
  }, [branch])

  const waiting = tickets.filter((t) => t.status === 'waiting')
  const called  = tickets.filter((t) => ['called','serving'].includes(t.status))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Animated background cycling through all queue images */}
      <AnimatedQueueBackground overlayOpacity="bg-slate-950/40" />

      {/* ── Header bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MdDashboard size={18} />
          </div>
          <div>
            <p className="font-extrabold text-white text-lg leading-tight">SmartQueue</p>
            <p className="text-xs text-slate-400">{branch?.name || 'Loading…'} · {branch?.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl font-extrabold text-amber-400">{waiting.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Waiting</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-indigo-400">{called.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Serving</p>
          </div>
          <Clock />
        </div>
      </motion.header>

      {/* ── Main board ── */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full relative z-10">

        {/* Now Serving */}
        <NowServing tickets={tickets} />

        {/* Waiting list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Waiting Queue
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MdCircle size={8} className="text-emerald-500" />
              Live — updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          {waiting.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MdCheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-300">Queue is empty</p>
              <p className="text-slate-500 text-sm mt-1">No customers waiting right now.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col gap-3">
                {waiting.map((t, i) => (
                  <TicketRow key={t._id} ticket={t} index={i} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 px-6 py-3 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <span>SmartQueue Display Board</span>
        <div className="flex items-center gap-1.5">
          <MdCircle size={8} className="text-emerald-500" />
          Connected — real-time via WebSocket
        </div>
      </div>
    </div>
  )
}
