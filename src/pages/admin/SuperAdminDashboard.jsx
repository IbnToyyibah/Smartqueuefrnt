import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdBusiness, MdPeople, MdCheckCircle, MdAccessTime, MdSecurity,
  MdHistory, MdSettings, MdArrowForward, MdWarning, MdCircle,
  MdTrendingUp, MdTrendingDown,
} from 'react-icons/md'
import { branchApi, analyticsApi, userApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

function KPI({ label, value, color = 'violet' }) {
  const colors = {
    violet: 'border-l-4 border-violet-500', green: 'border-l-4 border-emerald-500',
    amber: 'border-l-4 border-amber-500', blue: 'border-l-4 border-blue-500',
    red: 'border-l-4 border-red-400',
  }
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 ${colors[color]}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
    </div>
  )
}

const SYSTEM_HEALTH = [
  { label: 'WebSocket service', status: 'healthy' },
  { label: 'SMS gateway', status: 'healthy' },
  { label: 'Email service', status: 'healthy' },
  { label: 'Database cluster', status: 'healthy' },
  { label: 'Analytics pipeline', status: 'healthy' },
]

const MOCK_AUDIT = [
  { user: 'Fatima S.', action: 'Added branch — Ibadan Office', time: '5 min ago' },
  { user: 'Chidi O.', action: 'Updated Counter 3 settings', time: '12 min ago' },
  { user: 'Amira B.', action: 'Marked A104 as served', time: '18 min ago' },
  { user: 'Fatima S.', action: 'Created staff user — Seun A.', time: '1 hr ago' },
]

export default function SuperAdminDashboard() {
  const [branches, setBranches] = useState([])
  const [platform, setPlatform] = useState([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      branchApi.list(),
      analyticsApi.platform(7),
      userApi.list(),
    ])
      .then(([{ branches: b }, { perBranch }, { users: u }]) => {
        setBranches(b)
        setPlatform(perBranch || [])
        setUserCount(u?.length || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getPerf = (id) => platform.find(p => p._id?.toString() === id?.toString())
  const totalServed = platform.reduce((s, p) => s + (p.served || 0), 0)
  const avgWait = platform.length ? Math.round(platform.reduce((s, p) => s + (p.avgWait || 0), 0) / platform.length) : 0
  const operational = branches.filter(b => b.status === 'operational').length
  const degraded = branches.filter(b => b.status === 'degraded').length

  return (
    <AppLayout>
      <PageHeader title="Super Admin Dashboard"
        subtitle="Platform-wide overview — branches, users, system health"
        breadcrumb="Super Admin"
        action={
          <Link to="/admin/settings">
            <Button variant="secondary" size="sm" icon={<MdSettings size={14} />}>System Settings</Button>
          </Link>
        } />

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <KPI label="Total Branches" value={branches.length} color="violet" />
        <KPI label="Operational" value={operational} color="green" />
        <KPI label="Degraded" value={degraded} color="amber" />
        <KPI label="Served (7d)" value={totalServed} color="blue" />
        <KPI label="Platform Avg Wait" value={`${avgWait}m`} color="slate" />
      </div>

      {/* Degraded alert */}
      {degraded > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
          <MdWarning size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            {degraded} branch{degraded > 1 ? 'es are' : ' is'} degraded — review and dispatch support.
          </p>
          <Link to="/admin/branches" className="ml-auto text-xs font-bold text-amber-700 hover:underline shrink-0">
            View →
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Branch list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branches</h2>
            <Link to="/admin/branches">
              <Button variant="ghost" size="sm" iconRight={<MdArrowForward size={13} />}>Manage All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MdBusiness size={36} className="mx-auto mb-2 opacity-30" />
              <p>No branches yet. <Link to="/admin/branches" className="text-violet-600 font-semibold">Add one</Link>.</p>
            </div>
          ) : (
            branches.map((b, i) => {
              const perf = getPerf(b._id)
              const served = perf?.served || 0
              const wait = Math.round(perf?.avgWait || 0)
              const statusCfg = {
                operational: 'border-emerald-200 bg-emerald-50/30',
                degraded: 'border-amber-200 bg-amber-50/30',
                offline: 'border-red-200 bg-red-50/30',
              }
              return (
                <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border-2 p-4 ${statusCfg[b.status] ?? statusCfg.operational}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.city} · {b.category}</p>
                    </div>
                    <Badge variant={b.status === 'operational' ? 'active' : b.status === 'degraded' ? 'warning' : 'error'} size="sm">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Served (7d)', value: served },
                      { label: 'Avg wait', value: `${wait}m` },
                      { label: 'No-shows', value: perf?.noShow || 0 },
                    ].map(m => (
                      <div key={m.label} className="bg-white/60 rounded-lg p-2">
                        <p className="text-[10px] text-slate-400">{m.label}</p>
                        <p className="text-sm font-bold text-slate-800">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Quick nav */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Management</h3>
            <div className="flex flex-col gap-1">
              {[
                { to: '/admin/branches', label: 'Branches', icon: <MdBusiness size={15} /> },
                { to: '/admin/users', label: 'Users', icon: <MdPeople size={15} /> },
                { to: '/admin/permissions', label: 'Permissions', icon: <MdSecurity size={15} /> },
                { to: '/admin/analytics', label: 'Analytics', icon: <MdCheckCircle size={15} /> },
                { to: '/admin/settings', label: 'System Settings', icon: <MdSettings size={15} /> },
                { to: '/admin/audit', label: 'Audit Logs', icon: <MdHistory size={15} /> },
              ].map(l => (
                <Link key={l.to} to={l.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors text-sm font-medium">
                  <span className="text-violet-400 shrink-0">{l.icon}</span>
                  {l.label}
                  <MdArrowForward size={13} className="ml-auto opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* System health */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">System Health</h3>
            <div className="flex flex-col gap-2">
              {SYSTEM_HEALTH.map(s => (
                <div key={s.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <MdCircle size={8} className={s.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'} />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit log preview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Audit</h3>
              <Link to="/admin/audit" className="text-xs text-violet-600 hover:underline font-semibold">View all</Link>
            </div>
            <div className="flex flex-col gap-3">
              {MOCK_AUDIT.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {a.user.split('')[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{a.user}</p>
                    <p className="text-[11px] text-slate-500">{a.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
