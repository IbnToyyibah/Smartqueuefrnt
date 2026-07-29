import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdPeople, MdDashboard, MdCheckCircle, MdAccessTime,
  MdWarning, MdArrowForward, MdPause, MdPlayArrow, MdStar,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { analyticsApi, branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

function TrialBanner({ user }) {
  const navigate = useNavigate()

  if (!user || user.role !== 'branch_admin') return null
  if (user.subscribed) return null
  if (!user.trialActive) return null

  const days = user.trialDaysLeft ?? 0
  const expired = days <= 0

  if (expired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-5">
        <span className="text-2xl">Warning</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-700">Your 14-day free trial has expired</p>
          <p className="text-xs text-red-500 mt-0.5">Please subscribe to continue using SmartQueue Branch Admin features.</p>
        </div>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 shrink-0"
          onClick={() => navigate('/admin/settings')}
        >
          Subscribe Now
        </Button>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 mb-5 ${days <= 3 ? 'bg-red-50 border border-red-200' : days <= 7 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
      <MdStar size={20} className={days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-blue-500'} />
      <div className="flex-1">
        <p className={`text-sm font-bold ${days <= 3 ? 'text-red-700' : days <= 7 ? 'text-amber-700' : 'text-blue-700'}`}>
          Free trial - {days} day{days !== 1 ? 's' : ''} remaining
        </p>
        <p className={`text-xs mt-0.5 ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-600' : 'text-blue-500'}`}>
          {days <= 3 ? 'Trial ending soon! Subscribe to avoid interruption.' : 'Enjoying SmartQueue? Subscribe before your trial ends.'}
        </p>
      </div>
      {days <= 7 && (
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 shrink-0"
          onClick={() => navigate('/admin/settings')}
        >
          Subscribe
        </Button>
      )}
    </div>
  )
}

function KPI({ label, value, sub, color = 'violet' }) {
  const colors = {
    violet: 'border-l-4 border-violet-500 bg-white',
    green: 'border-l-4 border-emerald-500 bg-white',
    amber: 'border-l-4 border-amber-500 bg-white',
    blue: 'border-l-4 border-blue-500 bg-white',
    red: 'border-l-4 border-red-400 bg-white',
    slate: 'border-l-4 border-slate-400 bg-white',
  }
  return (
    <div className={`rounded-2xl border border-slate-100 p-4 ${colors[color]}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 mt-0.5 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const COUNTER_STATUS = {
  active: { bg: 'bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500', label: 'Active', text: 'text-emerald-700' },
  paused: { bg: 'bg-amber-50 border-amber-300', dot: 'bg-amber-500', label: 'Paused', text: 'text-amber-700' },
  closed: { bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', label: 'Closed', text: 'text-slate-500' },
  idle: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400', label: 'Idle', text: 'text-blue-600' },
  busy: { bg: 'bg-violet-50 border-violet-300', dot: 'bg-violet-600', label: 'Busy', text: 'text-violet-700' },
}

export default function BranchOverview() {
  const { queue, counters, waitingCount, loadBranchData, toggleCounter, loading } = useQueue()
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [stats, setStats] = useState(null)
  const [loadingA, setLoadingA] = useState(true)
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('')

  const branchId = selectedBranch || user?.branch?._id || user?.branch

  useEffect(() => {
    if (user?.role !== 'super_admin') return
    branchApi.list()
      .then(({ branches: list }) => {
        setBranches(list || [])
        if (!selectedBranch && list?.[0]?._id) setSelectedBranch(list[0]._id)
      })
      .catch(console.error)
  }, [user?.role, selectedBranch])

  useEffect(() => {
    if (!branchId) {
      setLoadingA(false)
      return
    }
    loadBranchData(branchId)
    analyticsApi.branch(branchId, 1)
      .then(({ totals }) => setStats(totals))
      .catch(console.error)
      .finally(() => setLoadingA(false))
  }, [branchId])

  const totalToday = stats?.totalTickets ?? 0
  const completedToday = stats?.totalServed ?? 0
  const cancelledToday = stats?.totalNoShow ?? 0
  const avgWait = Math.round(stats?.avgWaitTime ?? 0)
  const activeCounters = counters.filter(c => c.status === 'active').length

  const handleToggle = async (id) => {
    const c = counters.find(c => c._id === id)
    await toggleCounter(id)
    notify('info', c?.status === 'active' ? 'Counter paused' : 'Counter resumed', c?.name)
  }

  return (
    <AppLayout>
      <PageHeader
        title="Branch Dashboard"
        subtitle={user?.branch?.name ?? 'Branch Operations'}
        breadcrumb="Branch Admin"
        action={
          <Link to="/admin/settings">
            <Button variant="secondary" size="sm">Settings</Button>
          </Link>
        }
      />

      {user?.role === 'super_admin' && branches.length > 0 && (
        <div className="mb-5 max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select branch</label>
          <select
            value={branchId}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}

      {!branchId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 mb-5">
          <p className="font-semibold">No branch selected</p>
          <p className="text-sm mt-1 text-amber-700">Pick a branch to view branch metrics and counters.</p>
        </div>
      )}

      <TrialBanner user={user} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Queues Today" value={totalToday} color="violet" />
        <KPI label="Waiting Now" value={waitingCount} color="amber" />
        <KPI label="Active Counters" value={`${activeCounters}/${counters.length}`} color="blue" />
        <KPI label="Avg Wait" value={`${avgWait} min`} color="slate" />
        <KPI label="Completed" value={completedToday} color="green" />
        <KPI label="Cancelled" value={cancelledToday} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Queue Monitor</h2>
            <Link to="/admin/counters">
              <Button variant="ghost" size="sm" iconRight={<MdArrowForward size={13} />}>Manage</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {counters.map(c => {
                const serving = queue.find(t => t.counter === c._id && ['called', 'serving'].includes(t.status))
                const statusKey = c.status === 'active' ? (serving ? 'busy' : 'idle') : c.status
                const cfg = COUNTER_STATUS[statusKey] ?? COUNTER_STATUS.closed
                return (
                  <motion.div key={c._id} layout className={`rounded-2xl border-2 p-4 ${cfg.bg} transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                      </div>
                      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                    </div>

                    {serving ? (
                      <div className="bg-white/80 rounded-xl px-3 py-2 mb-2">
                        <p className="text-[10px] text-slate-400">Serving</p>
                        <p className="font-extrabold text-violet-600 text-lg tracking-widest leading-tight">{serving.ticketNumber}</p>
                        <p className="text-xs text-slate-500 truncate">{serving.name}</p>
                      </div>
                    ) : (
                      <div className="bg-white/60 rounded-xl px-3 py-2 mb-2">
                        <p className="text-xs text-slate-400">{c.status === 'closed' ? 'Counter closed' : 'Waiting for next customer'}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">{c.agent?.name ?? 'Unassigned'}</p>
                      {c.status !== 'closed' && (
                        <button
                          onClick={() => handleToggle(c._id)}
                          className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 transition-colors"
                          title="Toggle"
                        >
                          {c.status === 'active' ? <MdPause size={15} /> : <MdPlayArrow size={15} />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Manage</h3>
            <div className="flex flex-col gap-1">
              {[
                { to: '/admin/staff', label: 'Manage Staff', icon: <MdPeople size={15} />, desc: 'Add, edit, assign' },
                { to: '/admin/counters', label: 'Manage Counters', icon: <MdDashboard size={15} />, desc: 'Open, close, pause' },
                { to: '/admin/services', label: 'Manage Services', icon: <MdCheckCircle size={15} />, desc: 'Add, edit services' },
                { to: '/admin/analytics', label: 'Analytics', icon: <MdAccessTime size={15} />, desc: 'Charts & reports' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors"
                >
                  <span className="text-violet-400 shrink-0">{l.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.desc}</p>
                  </div>
                  <MdArrowForward size={13} className="opacity-40 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {cancelledToday > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MdWarning size={16} className="text-red-400" />
                <p className="text-sm font-bold text-red-700">No-shows today: {cancelledToday}</p>
              </div>
              <p className="text-xs text-red-500">Consider sending reminder notifications to reduce no-shows.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
