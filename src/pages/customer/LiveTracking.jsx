import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAccessTime, MdPeople, MdQrCode2, MdNotifications,
  MdCheckCircle, MdLocationOn, MdAdd,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { queueApi } from '../../lib/api'
import { getSocket, joinBranch } from '../../lib/socket'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import QRCodeDisplay from '../../components/ui/QRCodeDisplay'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_CFG = {
  waiting: { label: 'Waiting', color: 'amber', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', msg: "Your ticket is in the queue. We'll notify you as you get closer." },
  called: { label: 'Called — Please proceed', color: 'blue', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500 animate-ping', msg: 'Your number has been called! Please proceed to your counter now.' },
  serving: { label: 'Being served', color: 'indigo', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500', msg: 'You are currently being served. Thank you for your patience.' },
  served: { label: 'Service complete', color: 'served', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', msg: 'Your session is complete. Thank you for using SmartQueue!' },
  noshow: { label: 'Marked no-show', color: 'noshow', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400', msg: 'You were marked as a no-show. Re-register if you still need service.' },
}

const MILESTONES = [
  { label: 'Ticket registered', done: true },
  { label: '10 people ahead', key: 10 },
  { label: '5 people ahead', key: 5 },
  { label: 'Almost your turn', key: 2 },
  { label: "You're next!", key: 0 },
]

function PositionRing({ position, total }) {
  const pct = total > 0 ? Math.max(0, 1 - (position - 1) / total) : 1
  const r = 52, circ = 2 * Math.PI * r
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
        <motion.circle cx="72" cy="72" r={r} fill="none" stroke="url(#vg)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <motion.p key={position} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-extrabold text-slate-800 leading-none">
          #{position}
        </motion.p>
        <p className="text-xs text-slate-400 mt-1">your position</p>
      </div>
    </div>
  )
}

export default function LiveTracking() {
  const { activeTicket, setActiveTicket } = useQueue()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(activeTicket)
  const [loading, setLoading] = useState(!activeTicket)
  const [showQR, setShowQR] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  /* ── Load ticket on mount ── */
  useEffect(() => {
    if (activeTicket) { setTicket(activeTicket); setLoading(false); return }
    queueApi.myTicket()
      .then(({ ticket: t }) => {
        setTicket(t)
        setActiveTicket(t)
        if (t?.branch?._id) joinBranch(t.branch._id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* ── Socket live updates ── */
  useEffect(() => {
    const sock = getSocket()
    if (!sock || !ticket) return
    const handler = (updated) => {
      if (updated._id === ticket._id || updated.id === ticket.id) {
        setTicket(updated)
        setActiveTicket(updated)
        setLastUpdate(new Date())
      }
    }
    sock.on('queue:called', handler)
    sock.on('queue:served', handler)
    sock.on('queue:noshow', handler)
    sock.on('queue:updated', handler)
    return () => {
      sock.off('queue:called', handler)
      sock.off('queue:served', handler)
      sock.off('queue:noshow', handler)
      sock.off('queue:updated', handler)
    }
  }, [ticket])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!ticket) {
    return (
      <AppLayout>
        <PageHeader title="My Ticket" subtitle="Live queue tracking" breadcrumb="Customer" />
        <EmptyState icon={<MdQrCode2 size={32} />} title="No active ticket"
          description="You haven't joined a queue yet."
          action={<Link to="/customer/register"><Button className="bg-violet-600 hover:bg-violet-700" icon={<MdAdd size={18} />}>Join a Queue</Button></Link>} />
      </AppLayout>
    )
  }

  const cfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.waiting
  const branchId = ticket.branch?._id || ticket.branch
  const milestones = MILESTONES.map((m, i) => ({
    ...m, done: i === 0 || (ticket.position <= m.key),
  }))

  return (
    <AppLayout>
      <PageHeader title="My Ticket" subtitle="Live queue position — updates in real time" breadcrumb="Customer"
        action={
          <Button variant="secondary" size="sm" icon={<MdQrCode2 size={16} />} onClick={() => setShowQR(true)}>
            Show QR Code
          </Button>
        } />

      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Status banner */}
        <motion.div key={ticket.status} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 flex items-center gap-3 ${cfg.bg}`}>
          <span className="relative flex h-3 w-3 shrink-0">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${cfg.dot.replace(' animate-ping', '')}`} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.msg}</p>
          </div>
          <Badge variant={cfg.color}>{ticket.ticketNumber}</Badge>
        </motion.div>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <PositionRing position={ticket.position || 1} total={10} />
              <p className="text-xs text-slate-400">
                Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {[
                { icon: <MdAccessTime size={20} className="text-violet-500" />, label: 'Est. wait', value: `${ticket.estimatedWait ?? 0} min`, bg: 'bg-violet-50' },
                { icon: <MdPeople size={20} className="text-indigo-500" />, label: 'Ahead of you', value: Math.max(0, (ticket.position || 1) - 1), bg: 'bg-indigo-50' },
                { icon: <MdLocationOn size={20} className="text-emerald-500" />, label: 'Branch', value: (ticket.branch?.name || '—').split(' ')[0], bg: 'bg-emerald-50' },
                { icon: <MdNotifications size={20} className="text-amber-500" />, label: 'Notify via', value: (ticket.notifyChannel || 'email').toUpperCase(), bg: 'bg-amber-50' },
              ].map(m => (
                <div key={m.label} className={`${m.bg} rounded-2xl p-3`}>
                  <div className="mb-1">{m.icon}</div>
                  <p className="text-[11px] text-slate-500">{m.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {ticket.counter && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 bg-violet-600 rounded-2xl p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg">
                {(ticket.counter?.name || ticket.counter).replace('Counter ', '')}
              </div>
              <div>
                <p className="text-xs text-violet-200">Proceed to</p>
                <p className="text-xl font-extrabold">{ticket.counter?.name || ticket.counter}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Journey timeline */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Your journey</h3>
          <div className="flex flex-col gap-0">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-violet-600' : 'bg-slate-100'}`}>
                    {m.done ? <MdCheckCircle size={14} className="text-white" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                  </div>
                  {i < milestones.length - 1 && <div className={`w-0.5 h-8 mt-1 ${m.done ? 'bg-violet-200' : 'bg-slate-100'}`} />}
                </div>
                <p className={`text-sm pt-0.5 ${m.done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket details */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Ticket details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Ticket No.', value: ticket.ticketNumber },
              { label: 'Service', value: ticket.service?.label || ticket.service?.name },
              { label: 'Branch', value: ticket.branch?.name },
              { label: 'Checked in', value: new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ].map(r => (
              <div key={r.label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">{r.label}</p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{r.value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 pb-4">Queue position updates automatically via WebSocket</p>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full"
              onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-lg">Your QR Code</p>
                <p className="text-xs text-slate-500 mt-1">Show this at the venue to check in</p>
              </div>
              <QRCodeDisplay value={ticket.qrCode || ticket.ticketNumber} ticketNumber={ticket.ticketNumber} size={200} />
              <Badge variant={cfg.color} size="lg">{cfg.label}</Badge>
              <Button variant="secondary" size="sm" onClick={() => setShowQR(false)}>Close</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
