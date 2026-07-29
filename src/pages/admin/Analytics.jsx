import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MdAccessTime, MdPeople, MdCheckCircle, MdDownload,
  MdBarChart, MdTrendingUp,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { analyticsApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

const RANGES = [
  { label: 'Today', days: 1 },
  { label: 'This week', days: 7 },
  { label: 'This month', days: 30 },
  { label: 'Last 3 months', days: 90 },
]

/* ── Pure SVG bar chart ── */
function BarChart({ data, valueKey, labelKey, color = '#7c3aed', height = 110 }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${data.length * 44} ${height + 28}`} className="w-full" style={{ minWidth: data.length * 38 }}>
        {data.map((d, i) => {
          const barH = Math.max(4, ((d[valueKey] || 0) / max) * height)
          const x = i * 44 + 4
          const y = height - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={36} height={barH} rx="5" fill={color} opacity={0.82} />
              {d[valueKey] > 0 && (
                <text x={x + 18} y={y - 5} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                  {Math.round(d[valueKey])}
                </text>
              )}
              <text x={x + 18} y={height + 18} textAnchor="middle" fontSize="9" fill="#94a3b8">
                {typeof d[labelKey] === 'string' ? d[labelKey].slice(-5) : d[labelKey]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Stars({ value }) {
  if (!value) return <span className="text-slate-300 text-xs">No ratings</span>
  return <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))} {value.toFixed(1)}</span>
}

export default function Analytics() {
  const { user } = useAuth()
  const { notify } = useNotifications()

  const [days, setDays] = useState(7)
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const branchId = user?.branch?._id || user?.branch

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    analyticsApi.branch(branchId, days)
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [branchId, days])

  const totals = data?.totals || {}
  const daily = data?.daily || []
  const hourly = data?.hourly || []
  const services = data?.services || []

  const noShowRate = totals.totalServed
    ? ((totals.totalNoShow / (totals.totalServed + totals.totalNoShow)) * 100).toFixed(1)
    : '0'

  const handleExport = (fmt) => notify('success', `Exporting ${fmt}`, `Your ${RANGES.find(r => r.days === days)?.label} report is being generated.`)

  return (
    <AppLayout>
      <PageHeader title="Analytics & Reports"
        subtitle="Queue performance, wait-time trends, and staff productivity"
        breadcrumb="Admin"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<MdDownload size={15} />} onClick={() => handleExport('CSV')}>CSV</Button>
            <Button variant="secondary" size="sm" icon={<MdDownload size={15} />} onClick={() => handleExport('PDF')}>PDF</Button>
          </div>
        } />

      {/* Date range filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {RANGES.map(r => (
          <button key={r.days} onClick={() => setDays(r.days)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${days === r.days ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MdCheckCircle size={20} />} label="Total served" value={totals.totalServed ?? 0} color="green" trend={8} sub={RANGES.find(r => r.days === days)?.label} />
        <StatCard icon={<MdAccessTime size={20} />} label="Avg wait time" value={`${Math.round(totals.avgWaitTime || 0)} min`} color="blue" trend={-5} sub="vs last period" />
        <StatCard icon={<MdPeople size={20} />} label="No-show rate" value={`${noShowRate}%`} color="amber" trend={-2} sub="Target: <10%" />
        <StatCard icon={<MdBarChart size={20} />} label="Total no-shows" value={totals.totalNoShow ?? 0} color="rose" sub={RANGES.find(r => r.days === days)?.label} />
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-6 flex-wrap">
        {[['overview', 'Overview'], ['hourly', 'Hourly'], ['services', 'By Service']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-white text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || daily.length === 0 ? (
        <EmptyState icon={<MdBarChart size={32} />} title="No data yet"
          description="Queue activity will appear here once customers start joining." />
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Customers served — daily</h3>
                  <p className="text-xs text-slate-400 mb-4">Served per day</p>
                  <BarChart data={daily} valueKey="served" labelKey="_id" color="#7c3aed" />
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Avg wait time — daily</h3>
                  <p className="text-xs text-slate-400 mb-4">Minutes per day</p>
                  <BarChart data={daily.filter(d => d.avgWait)} valueKey="avgWait" labelKey="_id" color="#0ea5e9" height={100} />
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-800">Daily summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase tracking-wider">
                      <tr>{['Date', 'Served', 'No-shows', 'Avg wait', 'No-show rate'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {daily.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {new Date(d._id).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{d.served || '—'}</td>
                          <td className="px-4 py-3 text-slate-700">{d.noShow || '—'}</td>
                          <td className="px-4 py-3 text-slate-700">{d.avgWait ? `${Math.round(d.avgWait)} min` : '—'}</td>
                          <td className="px-4 py-3">
                            {d.served ? (
                              <Badge variant={((d.noShow / (d.served + d.noShow || 1)) * 100) > 10 ? 'warning' : 'success'} size="sm">
                                {((d.noShow / (d.served + d.noShow || 1)) * 100).toFixed(1)}%
                              </Badge>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Hourly */}
          {tab === 'hourly' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Served per hour — today</h3>
                  <BarChart data={hourly.map(h => ({ ...h, label: `${h._id}:00` }))} valueKey="served" labelKey="label" color="#7c3aed" />
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Queue depth per hour</h3>
                  <BarChart data={hourly.map(h => ({ ...h, label: `${h._id}:00` }))} valueKey="waiting" labelKey="label" color="#8b5cf6" />
                </div>
              </div>
              {hourly.length > 0 && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <MdTrendingUp size={22} />
                    <h3 className="font-bold">Peak hour analysis</h3>
                  </div>
                  {(() => {
                    const peak = hourly.reduce((p, c) => (c.served || 0) > (p.served || 0) ? c : p, hourly[0])
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Peak hour', value: `${peak._id}:00 – ${peak._id + 1}:00` },
                          { label: 'Max served', value: `${peak.served ?? 0} / hr` },
                          { label: 'Peak avg wait', value: `${Math.round(peak.avgWait || 0)} min` },
                        ].map(m => (
                          <div key={m.label} className="bg-white/10 rounded-2xl p-3 text-center">
                            <p className="text-xs text-violet-200">{m.label}</p>
                            <p className="text-lg font-extrabold mt-0.5">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Services */}
          {tab === 'services' && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">Performance by service type</h3>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No service data for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase tracking-wider">
                      <tr>{['Service', 'Served', 'Avg wait', 'No-shows', 'Rating'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {services.map((s, i) => (
                        <motion.tr key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="hover:bg-slate-50/60">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                              <span className="font-medium text-slate-800">{s.label || s._id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{s.served}</td>
                          <td className="px-4 py-4 text-slate-600">{s.avgWait ? `${Math.round(s.avgWait)} min` : '—'}</td>
                          <td className="px-4 py-4"><Badge variant={s.noShow > 10 ? 'warning' : 'success'} size="sm">{s.noShow}</Badge></td>
                          <td className="px-4 py-4"><Stars value={s.avgRating} /></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
