import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSkipNext, MdCheckCircle, MdPause, MdPlayArrow,
  MdRefresh, MdFastForward, MdSwapHoriz,
  MdPeople, MdDashboard, MdWarning, MdSend,
  MdEmail, MdSms, MdChat,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { queueApi, counterApi, notifApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const STATUS_COLOR = {
  waiting: 'bg-amber-100 text-amber-700',
  checked_in: 'bg-blue-100 text-blue-700',
  called: 'bg-indigo-100 text-indigo-700',
  serving: 'bg-violet-100 text-violet-700',
  served: 'bg-green-100 text-green-700',
  noshow: 'bg-red-100 text-red-500',
  skipped: 'bg-slate-100 text-slate-500',
}

function KPICard({ label, value, sub, color = 'violet' }) {
  const colors = { violet: 'bg-violet-600', indigo: 'bg-indigo-600', green: 'bg-emerald-600', amber: 'bg-amber-500' }
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-4">
      <div className={`w-2 self-stretch rounded-full ${colors[color]}`} />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ActionCard({ title, subtitle, icon, gradient, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-white bg-gradient-to-br ${gradient} shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight">{title}</p>
        <p className="text-[11px] text-white/80 mt-0.5 leading-tight">{subtitle}</p>
      </div>
      <span className="text-white/50 group-hover:text-white/80 transition-colors">→</span>
    </button>
  )
}

export default function StaffDashboard() {
  const { queue, counters, stats, loading, loadBranchData,
    callNext, markServed, toggleCounter, transferTicket } = useQueue()
  const { user } = useAuth()
  const { notify } = useNotifications()

  const [busy, setBusy] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messageChannel, setMessageChannel] = useState('auto')

  const branchId = user?.branch?._id || user?.branch
  const myCounter = counters.find(c => c.agent?._id === user?._id || c.agent === user?._id) || counters[0] || null

  useEffect(() => {
    if (branchId) loadBranchData(branchId)
  }, [branchId, loadBranchData])

  const wrap = async (fn, ...args) => { setBusy(true); try { return await fn(...args) } finally { setBusy(false) } }

  const activeQueue = queue.filter(t => ['waiting', 'checked_in', 'called', 'serving'].includes(t.status))
  const servingTicket = queue.find(t => String(t.counter?._id || t.counter) === String(myCounter?._id) && ['called', 'serving'].includes(t.status))
  const waitingCount = queue.filter(t => ['waiting', 'checked_in'].includes(t.status)).length
  const servedToday = stats?.totalServed ?? 0
  const avgWait = stats?.avgWaitTime ?? 0
  const preferredChannel = servingTicket?.notifyChannel || servingTicket?.user?.notifyChannel || 'email'
  const resolvedChannel = messageChannel === 'auto' ? preferredChannel : messageChannel
  const channelMeta = {
    email: { label: 'Email', icon: <MdEmail size={14} />, tone: 'bg-sky-50 text-sky-700 border-sky-200' },
    sms: { label: 'SMS', icon: <MdSms size={14} />, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    both: { label: 'Both', icon: <MdChat size={14} />, tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  }

  const handleCallNext = async () => {
    const t = await wrap(callNext, myCounter?._id)
    if (t) notify('info', `Calling ${t.ticketNumber}`, `${t.name} â€” ${t.service?.label}`)
    else notify('warning', 'Queue empty', 'No customers waiting.')
  }

  const handleComplete = async () => {
    if (!servingTicket) return
    await wrap(markServed, servingTicket._id, myCounter?._id)
    notify('success', 'Completed', `${servingTicket.ticketNumber} served.`)
  }

  const handlePauseResume = async () => {
    if (!myCounter) return
    const wasActive = myCounter.status === 'active'
    await wrap(toggleCounter, myCounter._id)
    notify('info', wasActive ? 'Counter paused' : 'Counter resumed', myCounter.name)
  }

  const handleRecall = async () => {
    if (!servingTicket) return
    try {
      setBusy(true)
      await queueApi.recall(servingTicket._id)
      notify('info', 'Recalled', `${servingTicket.ticketNumber} recalled.`)
    } catch {
      notify('error', 'Recall failed', '')
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = async (ticketId) => {
    const t = queue.find(q => q._id === ticketId)
    try {
      setBusy(true)
      await queueApi.skip(ticketId, { counterId: myCounter?._id })
      notify('warning', 'Skipped', `${t?.ticketNumber} moved to end.`)
    } catch {
      notify('error', 'Skip failed', '')
    } finally {
      setBusy(false)
    }
  }

  const handleTransfer = async (toCounterId) => {
    if (!transferTarget) return
    await wrap(transferTicket, transferTarget._id, toCounterId)
    const c = counters.find(c => c._id === toCounterId)
    notify('info', 'Transferred', `${transferTarget.ticketNumber} â†’ ${c?.name}`)
    setTransferOpen(false)
    setTransferTarget(null)
  }

  const handleSendMessage = async () => {
    if (!servingTicket || !messageText.trim()) return
    try {
      setBusy(true)
      await notifApi.sendToTicket(servingTicket._id, {
        title: 'Message from SmartQueue Staff',
        message: messageText.trim(),
        type: 'info',
        channel: resolvedChannel,
      })
      notify('success', 'Message sent', `Sent via ${resolvedChannel.toUpperCase()} to ${servingTicket.ticketNumber}.`)
      setMessageText('')
    } catch (err) {
      notify('error', 'Send failed', err.message || 'Could not send message.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Counter Dashboard"
        subtitle={`${myCounter?.name ?? 'Counter'} â€” ${user?.branch?.name ?? ''}`}
        breadcrumb="Staff"
      />

      {!branchId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 mb-5">
          <p className="font-semibold">No branch assigned</p>
          <p className="text-sm mt-1 text-amber-700">
            This dashboard needs a branch assignment before it can load live queue data.
          </p>
        </div>
      )}

      {branchId && !myCounter && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800 mb-5">
          <p className="font-semibold">No counter assigned</p>
          <p className="text-sm mt-1 text-blue-700">
            Your account is connected to this branch, but no active counter is assigned yet.
          </p>
        </div>
      )}

      {branchId && myCounter && queue.length === 0 && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 mb-5">
          <p className="font-semibold">No live queue data yet</p>
          <p className="text-sm mt-1 text-slate-600">
            The dashboard is connected, but there are no tickets loaded for this branch right now.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Customers Waiting" value={waitingCount} color="amber" sub="In queue now" />
        <KPICard label="Now Serving" value={servingTicket?.ticketNumber ?? 'â€”'} color="violet" sub="Active ticket" />
        <KPICard label="Served Today" value={servedToday} color="green" sub="Completed" />
        <KPICard label="Average Wait" value={`${avgWait} min`} color="indigo" sub="Current avg" />
      </div>

      <div className="grid items-stretch grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-4 mb-6">
        <div className="h-full rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Quick Actions</p>
              <p className="text-xs text-slate-500 mt-1">Fast controls for the active queue.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <MdDashboard size={14} className="text-violet-500" />
              {myCounter?.name || 'Counter'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <ActionCard title="Call Next" subtitle="Move next ticket" icon={<MdSkipNext size={18} />} gradient="from-violet-600 to-indigo-600" onClick={handleCallNext} disabled={waitingCount === 0 || busy} />
            <ActionCard title="Complete" subtitle="Finish service" icon={<MdCheckCircle size={18} />} gradient="from-emerald-500 to-emerald-600" onClick={handleComplete} disabled={!servingTicket || busy} />
            <ActionCard title={myCounter?.status === 'active' ? 'Pause' : 'Resume'} subtitle="Toggle counter" icon={myCounter?.status === 'active' ? <MdPause size={18} /> : <MdPlayArrow size={18} />} gradient="from-amber-500 to-orange-500" onClick={handlePauseResume} disabled={busy} />
            <ActionCard title="Recall" subtitle="Call again" icon={<MdRefresh size={18} />} gradient="from-sky-500 to-blue-600" onClick={handleRecall} disabled={!servingTicket || busy} />
            <ActionCard title="Skip" subtitle="Push back" icon={<MdFastForward size={18} />} gradient="from-slate-600 to-slate-700" onClick={() => servingTicket && handleSkip(servingTicket._id)} disabled={!servingTicket || busy} />
            <ActionCard title="Transfer" subtitle="Move queue" icon={<MdSwapHoriz size={18} />} gradient="from-indigo-500 to-violet-600" onClick={() => { if (servingTicket) { setTransferTarget(servingTicket); setTransferOpen(true) } }} disabled={!servingTicket || busy} />
          </div>
        </div>

        <div className="h-full rounded-3xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Customer Messaging</p>
              <p className="text-xs text-slate-500 mt-1">Message the active customer from the counter.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <MdSend size={14} className="text-violet-500" />
              {servingTicket ? servingTicket.ticketNumber : 'No ticket'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 flex-1 flex flex-col">
            <p className="text-sm font-semibold text-slate-800">Send a message to the current customer</p>
            <p className="text-xs text-slate-500 mt-1">Delivery follows the customer preference automatically.</p>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${channelMeta[preferredChannel]?.tone || channelMeta.email.tone}`}>
                {channelMeta[preferredChannel]?.icon || channelMeta.email.icon}
                {channelMeta[preferredChannel]?.label || 'Email'}
              </span>
              <span className="text-xs text-slate-500">{servingTicket ? servingTicket.ticketNumber : 'No active ticket'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { value: 'auto', label: 'Auto' },
                { value: 'sms', label: 'SMS' },
                { value: 'email', label: 'Email' },
                { value: 'both', label: 'Both' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMessageChannel(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    messageChannel === option.value
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              placeholder={servingTicket ? 'Type the message you want to send...' : 'Pick an active ticket to send this message.'}
              className="mt-2.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1 min-h-0"
              disabled={false}
            />
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {messageText.trim().length > 0 ? `${messageText.trim().length} characters` : 'Write a short update for the customer.'}
              </p>
              <Button
                onClick={handleSendMessage}
                disabled={!servingTicket || !messageText.trim() || busy}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {servingTicket && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-4 rounded-2xl bg-violet-600 p-4 text-white"
        >
          <div>
            <p className="text-xs text-violet-200">Now Serving</p>
            <p className="text-3xl font-extrabold tracking-widest">{servingTicket.ticketNumber}</p>
          </div>
          <div className="ml-4">
            <p className="text-sm font-semibold">{servingTicket.name}</p>
            <p className="text-xs text-violet-200">{servingTicket.service?.label}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="called" size="md">{myCounter?.name}</Badge>
          </div>
        </motion.div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div className="col-span-2">Token</div>
          <div className="col-span-4">Name / Service</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-1 text-right">Act.</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : activeQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <MdPeople size={36} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-slate-600">Queue is empty</p>
          </div>
        ) : (
          <AnimatePresence>
            {activeQueue.map((t, i) => (
              <motion.div
                key={t._id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-3 items-center border-b border-slate-50 px-5 py-3.5 last:border-0 hover:bg-slate-50/60"
              >
                <div className="col-span-2">
                  <span className="font-mono font-extrabold text-slate-800">{t.ticketNumber}</span>
                </div>
                <div className="col-span-4 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="truncate text-xs text-slate-400">{t.service?.label}</p>
                </div>
                <div className="col-span-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_COLOR[t.status] ?? STATUS_COLOR.waiting}`}>
                    {t.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-slate-400">{t.estimatedWait}m</div>
                <div className="col-span-1 flex justify-end">
                  {t.status === 'waiting' && (
                    <button
                      onClick={() => { setTransferTarget(t); setTransferOpen(true) }}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <MdSwapHoriz size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {queue.filter(t => t.status === 'noshow').length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">No-Shows Today</p>
          <div className="flex flex-col gap-2">
            {queue.filter(t => t.status === 'noshow').map(t => (
              <div key={t._id} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm">
                <MdWarning size={14} className="shrink-0 text-red-400" />
                <span className="font-mono font-bold text-slate-700">{t.ticketNumber}</span>
                <span className="text-slate-500">{t.name}</span>
                <span className="ml-auto text-xs text-slate-400">{t.service?.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={transferOpen}
        onClose={() => { setTransferOpen(false); setTransferTarget(null) }}
        title={`Transfer ${transferTarget?.ticketNumber ?? ''}`}
        size="sm"
      >
        <p className="mb-4 text-sm text-slate-600">
          Move <strong>{transferTarget?.name}</strong> to another active counter.
        </p>
        <div className="flex flex-col gap-2">
          {counters.filter(c => c.status === 'active' && c._id !== myCounter?._id).map(c => (
            <button
              key={c._id}
              onClick={() => handleTransfer(c._id)}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all hover:border-violet-400 hover:bg-violet-50"
            >
              <span className="font-semibold text-slate-800">{c.name}</span>
              <span className="text-xs text-slate-400">{c.agent?.name || 'Unassigned'}</span>
            </button>
          ))}
        </div>
      </Modal>

    </AppLayout>
  )
}

