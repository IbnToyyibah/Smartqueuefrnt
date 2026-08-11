import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MdAccessTime,
  MdBarChart,
  MdCheckCircle,
  MdDashboard,
  MdEmail,
  MdPeople,
  MdPause,
  MdPlayArrow,
  MdRefresh,
  MdSend,
  MdSkipNext,
  MdSms,
  MdSwapHoriz,
  MdWarning,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { notifApi, queueApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const TABS = ['Overview', 'Queue', 'Agents', 'Counters']
const STATUS_TONE = {
  waiting: 'bg-amber-500',
  checked_in: 'bg-sky-500',
  called: 'bg-indigo-500',
  serving: 'bg-emerald-500',
  served: 'bg-emerald-700',
  noshow: 'bg-rose-500',
  skipped: 'bg-slate-500',
}

const fmtWait = (m) => `${Math.max(0, Number(m) || 0)}m`

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-200/70">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-cyan-100/60">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, meta }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">Terminal</p>
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
      </div>
      {meta && <p className="text-xs text-cyan-100/60">{meta}</p>}
    </div>
  )
}

function TerminalCard({ children, className = '' }) {
  return <div className={`rounded-[28px] border border-white/10 bg-slate-950/80 shadow-2xl ${className}`}>{children}</div>
}

export default function StaffDashboard() {
  const { queue, counters, stats, loading, loadBranchData, callNext, markServed, toggleCounter, transferTicket } = useQueue()
  const { user } = useAuth()
  const { notify } = useNotifications()

  const [tab, setTab] = useState('Overview')
  const [busy, setBusy] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageChannel, setMessageChannel] = useState('auto')
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState(null)

  const branchId = user?.branch?._id || user?.branch
  const myCounter = counters.find((c) => c.agent?._id === user?._id || c.agent === user?._id) || counters[0] || null

  useEffect(() => {
    if (branchId) loadBranchData(branchId)
  }, [branchId, loadBranchData])

  const wrap = async (fn, ...args) => {
    setBusy(true)
    try {
      return await fn(...args)
    } finally {
      setBusy(false)
    }
  }

  const orderedQueue = useMemo(
    () => [...queue].sort((a, b) => (a.position || 0) - (b.position || 0)),
    [queue],
  )
  const activeQueue = orderedQueue.filter((t) => ['waiting', 'checked_in', 'called', 'serving'].includes(t.status))
  const nowServing = orderedQueue.find((t) => ['called', 'serving'].includes(t.status)) || null
  const waitingCount = queue.filter((t) => ['waiting', 'checked_in'].includes(t.status)).length
  const servedToday = stats?.totalServed ?? queue.filter((t) => t.status === 'served').length
  const avgWait = Math.round(stats?.avgWaitTime ?? 0)
  const noShowCount = queue.filter((t) => t.status === 'noshow').length
  const completionRate = queue.length ? Math.round((servedToday / queue.length) * 100) : 0

  const liveTicker = [
    `WAITING ${waitingCount}`,
    `SERVING ${orderedQueue.filter((t) => t.status === 'serving').length}`,
    `CALLED ${orderedQueue.filter((t) => t.status === 'called').length}`,
    `NOSHOW ${noShowCount}`,
    `COUNTERS ${counters.length}`,
  ]

  const agents = useMemo(() => {
    const seed = counters.map((counter, idx) => ({
      id: counter._id,
      name: counter.agent?.name || `Agent ${String(idx + 1).padStart(2, '0')}`,
      role: counter.agent?.role || 'staff',
      status: counter.status === 'active' ? 'available' : counter.status === 'paused' ? 'break' : 'offline',
      current: orderedQueue.find((t) => String(t.counter?._id || t.counter) === String(counter._id) && ['called', 'serving'].includes(t.status))?.ticketNumber || 'Idle',
      target: 12 + idx,
      done: queue.filter((t) => t.status === 'served' && (t.counter?._id || t.counter) === counter._id).length,
    }))
    return seed.length ? seed.slice(0, 8) : []
  }, [counters, orderedQueue, queue])

  const displayCounters = useMemo(() => {
    return counters.slice(0, 8).map((counter, idx) => ({
      id: counter._id,
      name: counter.name || `Counter ${idx + 1}`,
      status: counter.status || 'closed',
      agent: counter.agent?.name || 'Unassigned',
      service: counter.service?.name || counter.service?.label || 'General',
      served: queue.filter((t) => t.status === 'served' && (t.counter?._id || t.counter) === counter._id).length,
      active: queue.find((t) => String(t.counter?._id || t.counter) === String(counter._id) && ['called', 'serving'].includes(t.status))?.ticketNumber || 'Idle',
    }))
  }, [counters, queue])

  const handleCallNext = async () => {
    const t = await wrap(callNext, myCounter?._id)
    if (t) notify('info', `Calling ${t.ticketNumber}`, `${t.name} - ${t.service?.label}`)
    else notify('warning', 'Queue empty', 'No customers waiting.')
  }

  const handleComplete = async () => {
    if (!nowServing) return
    await wrap(markServed, nowServing._id, myCounter?._id)
    notify('success', 'Completed', `${nowServing.ticketNumber} served.`)
  }

  const handlePauseResume = async () => {
    if (!myCounter) return
    const wasActive = myCounter.status === 'active'
    await wrap(toggleCounter, myCounter._id)
    notify('info', wasActive ? 'Counter paused' : 'Counter resumed', myCounter.name)
  }

  const handleRecall = async () => {
    if (!nowServing) return
    try {
      setBusy(true)
      await queueApi.recall(nowServing._id)
      notify('info', 'Recalled', `${nowServing.ticketNumber} recalled.`)
    } catch {
      notify('error', 'Recall failed', '')
    } finally {
      setBusy(false)
    }
  }

  const handleTransfer = async (toCounterId) => {
    if (!transferTarget) return
    await wrap(transferTicket, transferTarget._id, toCounterId)
    const c = counters.find((item) => item._id === toCounterId)
    notify('info', 'Transferred', `${transferTarget.ticketNumber} -> ${c?.name}`)
    setTransferOpen(false)
    setTransferTarget(null)
  }

  const handleSendMessage = async () => {
    if (!nowServing || !messageText.trim()) return
    try {
      setBusy(true)
      await notifApi.sendToTicket(nowServing._id, {
        title: 'Message from SmartQueue Staff',
        message: messageText.trim(),
        type: 'info',
        channel: messageChannel,
      })
      notify('success', 'Message sent', `${nowServing.ticketNumber} updated.`)
      setMessageText('')
    } catch (err) {
      notify('error', 'Send failed', err.message || 'Could not send message.')
    } finally {
      setBusy(false)
    }
  }

  const queueRows = activeQueue.slice(0, 12)

  return (
    <AppLayout>
      <div className="terminal-mono min-h-[calc(100vh-7rem)] rounded-[32px] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-4 sm:p-6 text-slate-100">
        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 overflow-hidden">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300"><MdDashboard size={18} /></span>
              <span>SmartQueue Terminal</span>
              <span className="ml-auto text-cyan-100/40">Live</span>
            </div>
            <div className="mt-2 overflow-hidden whitespace-nowrap text-xs text-cyan-100/70">
              <div className="inline-block animate-[marquee_18s_linear_infinite]">
                {liveTicker.concat(liveTicker).map((item, i) => (
                  <span key={`${item}-${i}`} className="mr-8">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] transition-colors ${
                  tab === item
                    ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-cyan-100/60 hover:bg-white/10'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'Overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-4"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Stat label="Waiting" value={waitingCount} sub="In queue now" />
                  <Stat label="Serving" value={nowServing?.ticketNumber ?? '—'} sub="Active ticket" />
                  <Stat label="Served" value={servedToday} sub="Completed today" />
                  <Stat label="Wait" value={`${avgWait}m`} sub={`Completion ${completionRate}%`} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
                  <TerminalCard className="p-4">
                    <SectionTitle title="Live Queue" meta="Priority sort" />
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <div className="grid grid-cols-12 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-cyan-100/50">
                        <div className="col-span-2">Token</div>
                        <div className="col-span-4">Guest</div>
                        <div className="col-span-3">Service</div>
                        <div className="col-span-2">Wait</div>
                        <div className="col-span-1 text-right">Act</div>
                      </div>
                      <div className="max-h-[420px] overflow-auto divide-y divide-white/8">
                        {queueRows.map((t) => (
                          <div key={t._id} className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-white/5">
                            <div className="col-span-2 font-black text-white">{t.ticketNumber}</div>
                            <div className="col-span-4 min-w-0">
                              <div className="truncate font-semibold text-white">{t.name}</div>
                              <div className="truncate text-[11px] text-cyan-100/50">{t.position ? `Position ${t.position}` : 'Queue'}</div>
                            </div>
                            <div className="col-span-3 min-w-0 text-cyan-100/70 truncate">{t.service?.label || t.service?.name}</div>
                            <div className={`col-span-2 text-[11px] font-bold ${Number(t.estimatedWait || 0) > 10 ? 'text-rose-300' : Number(t.estimatedWait || 0) > 5 ? 'text-amber-300' : 'text-emerald-300'}`}>
                              {fmtWait(t.estimatedWait)}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_TONE[t.status] ?? 'bg-slate-400'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TerminalCard>

                  <div className="grid gap-4">
                    <TerminalCard className="p-4">
                      <SectionTitle title="Counter Actions" meta={myCounter?.name || 'Unassigned'} />
                      <div className="grid gap-2">
                        {[
                          { title: 'Call Next', icon: <MdSkipNext size={18} />, onClick: handleCallNext, active: waitingCount > 0 },
                          { title: 'Complete', icon: <MdCheckCircle size={18} />, onClick: handleComplete, active: !!nowServing },
                          { title: myCounter?.status === 'active' ? 'Pause' : 'Resume', icon: myCounter?.status === 'active' ? <MdPause size={18} /> : <MdPlayArrow size={18} />, onClick: handlePauseResume, active: true },
                          { title: 'Recall', icon: <MdRefresh size={18} />, onClick: handleRecall, active: !!nowServing },
                        ].map((a) => (
                          <button
                            key={a.title}
                            onClick={a.onClick}
                            disabled={!a.active || busy}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 disabled:opacity-40"
                          >
                            <span className="flex items-center gap-3">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">{a.icon}</span>
                              <span className="font-bold text-white">{a.title}</span>
                            </span>
                            <span className="text-cyan-100/40">→</span>
                          </button>
                        ))}
                      </div>
                    </TerminalCard>

                    <TerminalCard className="p-4">
                      <SectionTitle title="Now Serving" meta={nowServing ? nowServing.name : 'Idle'} />
                      {nowServing ? (
                        <div className="rounded-3xl border border-cyan-300/10 bg-cyan-400/10 p-4">
                          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/60">Ticket</p>
                          <p className="mt-1 text-4xl font-black text-white">{nowServing.ticketNumber}</p>
                          <p className="mt-2 text-sm text-cyan-100/70">{nowServing.service?.label || nowServing.service?.name}</p>
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-cyan-100/50">
                          No active ticket.
                        </div>
                      )}
                    </TerminalCard>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'Queue' && (
              <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TerminalCard className="p-4">
                  <SectionTitle title="Queue" meta={`${activeQueue.length} tickets`} />
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-12 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-cyan-100/50">
                      <div className="col-span-2">Ticket</div>
                      <div className="col-span-4">Guest</div>
                      <div className="col-span-2">Service</div>
                      <div className="col-span-1">Wait</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    <div className="divide-y divide-white/8">
                      {activeQueue.map((t) => (
                        <div key={t._id} className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-white/5">
                          <div className="col-span-2 font-black text-white">{t.ticketNumber}</div>
                          <div className="col-span-4 min-w-0">
                            <div className="truncate font-semibold text-white">{t.name}</div>
                            <div className="text-[11px] text-cyan-100/50">{t.position ? `Pos ${t.position}` : ''}</div>
                          </div>
                          <div className="col-span-2 truncate text-cyan-100/70">{t.service?.label || t.service?.name}</div>
                          <div className={`col-span-1 text-[11px] font-bold ${Number(t.estimatedWait || 0) > 10 ? 'text-rose-300' : Number(t.estimatedWait || 0) > 5 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {fmtWait(t.estimatedWait)}
                          </div>
                          <div className="col-span-1">
                            <Badge variant={t.status} size="sm" className="capitalize">
                              {t.status}
                            </Badge>
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                            {t.status === 'waiting' && (
                              <button
                                onClick={() => { setTransferTarget(t); setTransferOpen(true) }}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 text-cyan-100/70 hover:bg-white/10"
                              >
                                <MdSwapHoriz size={16} />
                              </button>
                            )}
                            {(t.status === 'called' || t.status === 'serving') && (
                              <button
                                onClick={() => markServed(t._id, myCounter?._id)}
                                className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-200 hover:bg-emerald-400/20"
                              >
                                <MdCheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TerminalCard>
              </motion.div>
            )}

            {tab === 'Agents' && (
              <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TerminalCard className="p-4">
                  <SectionTitle title="Agents" meta="8 active slots" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {(agents.length ? agents : Array.from({ length: 8 }).map((_, i) => ({
                      id: `agent-${i}`,
                      name: `Agent ${String(i + 1).padStart(2, '0')}`,
                      role: 'staff',
                      status: i % 3 === 0 ? 'available' : i % 3 === 1 ? 'break' : 'offline',
                      current: i % 2 === 0 ? `A0${i + 1}` : 'Idle',
                      target: 12 + i,
                      done: 6 + i,
                    }))).map((agent, i) => {
                      const pct = Math.min(100, Math.round((agent.done / Math.max(1, agent.target)) * 100))
                      return (
                        <div key={agent.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-white">{agent.name}</p>
                              <p className="text-[11px] text-cyan-100/50">{agent.role}</p>
                            </div>
                            <span className={`h-2.5 w-2.5 rounded-full ${i % 3 === 0 ? 'bg-emerald-400' : i % 3 === 1 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          </div>
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/50">Current</p>
                            <p className="mt-1 font-bold text-white">{agent.current}</p>
                          </div>
                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-100/50">
                              <span>Target</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10">
                              <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <button className="mt-4 w-full rounded-2xl border border-cyan-300/10 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/15">
                            Call Next
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </TerminalCard>
              </motion.div>
            )}

            {tab === 'Counters' && (
              <motion.div key="counters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TerminalCard className="p-4">
                  <SectionTitle title="Counters" meta={`${displayCounters.length} online slots`} />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {displayCounters.map((counter) => (
                      <div key={counter.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">{counter.name}</p>
                            <p className="text-[11px] text-cyan-100/50">{counter.service}</p>
                          </div>
                          <Badge variant={counter.status === 'active' ? 'success' : counter.status === 'paused' ? 'warning' : 'closed'} size="sm">
                            {counter.status}
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-100/50">Agent</p>
                            <p className="mt-1 font-bold text-white">{counter.agent}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-100/50">Active</p>
                            <p className="mt-1 font-bold text-white">{counter.active}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-100/50">Served Today</p>
                          <p className="mt-1 text-2xl font-black text-white">{counter.served}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TerminalCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
          {counters.filter((c) => c.status === 'active' && c._id !== myCounter?._id).map((c) => (
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
