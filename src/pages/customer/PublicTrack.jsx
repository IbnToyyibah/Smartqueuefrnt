import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSearch, MdAccessTime, MdPeople, MdLocationOn,
  MdCheckCircle, MdArrowForward, MdQrCode2, MdNotifications,
} from 'react-icons/md'
import { connectSocket, joinBranch } from '../../lib/socket'
import { queueApi } from '../../lib/api'
import PublicLayout from '../../components/layout/PublicLayout'
import Badge from '../../components/ui/Badge'
import QRCodeDisplay from '../../components/ui/QRCodeDisplay'

const STATUS_CFG = {
  waiting: { label: 'Waiting', color: 'amber', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  checked_in: { label: 'Checked In ✓', color: 'blue', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  called: { label: 'Called — Go Now!', color: 'info', bg: 'bg-blue-50 border-blue-300', dot: 'bg-blue-600 animate-ping' },
  serving: { label: 'Being Served', color: 'indigo', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  served: { label: 'Service Complete', color: 'success', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  noshow: { label: 'No Show', color: 'error', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
  skipped: { label: 'Skipped', color: 'warning', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
}

export default function PublicTrack() {
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('ticket') || '')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [nowServing, setNowServing] = useState(null)
  const socketRef = useRef(null)

  const lookupDirect = async (num) => {
    const q = (num || input).trim().toUpperCase()
    if (!q) return
    setLoading(true); setError('')
    try {
      const { ticket: found } = await queueApi.lookup(q)
      setTicket(found)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message || 'Could not connect to server.')
      setTicket(null)
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = searchParams.get('ticket')
    if (t) lookupDirect(t)
  }, [])

  /* Socket live updates */
  useEffect(() => {
    if (!ticket?.branch?._id) return
    const sock = connectSocket('')
    joinBranch(ticket.branch._id)
    const refresh = (updated) => {
      if (updated._id === ticket._id || updated.ticketNumber === ticket.ticketNumber) {
        setTicket(updated)
        setLastUpdate(new Date())
      }
      if (['called', 'serving'].includes(updated.status)) setNowServing(updated.ticketNumber)
    }
    sock.on('queue:called', refresh)
    sock.on('queue:served', refresh)
    sock.on('queue:checkedin', refresh)
    sock.on('queue:skipped', refresh)
    return () => { sock.off('queue:called'); sock.off('queue:served'); sock.off('queue:checkedin'); sock.off('queue:skipped') }
  }, [ticket?._id])

  const cfg = ticket ? STATUS_CFG[ticket.status] ?? STATUS_CFG.waiting : null
  const peopleAhead = Math.max(0, (ticket?.position || 1) - 1)

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/60 to-indigo-50/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-5">

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-extrabold text-slate-900">Track My Queue</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your ticket number to see your live position.</p>
          </motion.div>

          {/* Search box */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-2">
            <div className="relative flex-1">
              <MdSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && lookupDirect()}
                placeholder="e.g. A104"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button onClick={() => lookupDirect()}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" /> : 'Track'}
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </motion.div>
          )}

          <AnimatePresence>
            {ticket && cfg && (
              <motion.div key={ticket._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-4">

                {/* Status banner */}
                <div className={`rounded-2xl border p-4 flex items-center gap-3 ${cfg.bg}`}>
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${cfg.dot.replace(' animate-ping', '')}`} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
                    {ticket.counter && <p className="text-xs text-slate-500 mt-0.5">Proceed to {ticket.counter?.name || ticket.counter}</p>}
                  </div>
                  <Badge variant={cfg.color}>{ticket.ticketNumber}</Badge>
                </div>

                {/* Now serving + live stats */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  {(nowServing || ticket.status === 'called') && (
                    <div className="bg-violet-600 text-white rounded-xl p-3 mb-4 text-center">
                      <p className="text-xs text-violet-200 mb-0.5">Now Serving</p>
                      <p className="text-2xl font-extrabold tracking-widest">{nowServing || ticket.ticketNumber}</p>
                    </div>
                  )}

                  <div className="text-center mb-5">
                    <p className="text-xs text-slate-400 mb-1">You are</p>
                    <p className="text-5xl font-extrabold text-violet-600 tracking-widest">{ticket.ticketNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <MdPeople size={18} className="text-indigo-500" />, label: 'People Ahead', value: peopleAhead, bg: 'bg-indigo-50' },
                      { icon: <MdAccessTime size={18} className="text-amber-500" />, label: 'Estimated', value: `${ticket.estimatedWait ?? 0} min`, bg: 'bg-amber-50' },
                      { icon: <MdLocationOn size={18} className="text-emerald-500" />, label: 'Branch', value: ticket.branch?.name?.split(' ')[0] || '—', bg: 'bg-emerald-50' },
                      { icon: <MdNotifications size={18} className="text-violet-500" />, label: 'Notify via', value: (ticket.notifyChannel || '—').toUpperCase(), bg: 'bg-violet-50' },
                    ].map(m => (
                      <div key={m.label} className={`${m.bg} rounded-xl p-3`}>
                        <div className="mb-1">{m.icon}</div>
                        <p className="text-[11px] text-slate-500">{m.label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {lastUpdate && (
                    <p className="text-[10px] text-slate-400 text-center mt-3">
                      Last updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Updates automatically
                    </p>
                  )}
                </div>

                {/* QR code */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center gap-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">QR Code — Scan to Check In</p>
                  <QRCodeDisplay value={ticket.qrCode || ticket.ticketNumber} ticketNumber={ticket.ticketNumber} size={140} />
                  <p className="text-xs text-slate-400 text-center">Scan at the venue entrance to activate live tracking</p>
                </div>

                <Link to="/join-queue"
                  className="flex items-center justify-center gap-2 border border-slate-200 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-sm font-semibold py-3 rounded-xl transition-colors">
                  Join another queue <MdArrowForward size={14} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PublicLayout>
  )
}
