import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdHistory,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdAdd,
  MdSearch,
  MdFilterList,
  MdStar,
  MdStarBorder,
} from 'react-icons/md'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

const MOCK_HISTORY = [
  {
    id: 'h1',
    ticketNumber: 'A011',
    service: 'General Inquiry',
    branch: 'Lagos Main Branch',
    date: '2026-07-18',
    status: 'served',
    waitTime: 14,
    serviceTime: 8,
    rating: 5,
  },
  {
    id: 'h2',
    ticketNumber: 'A007',
    service: 'Account Services',
    branch: 'Lagos Main Branch',
    date: '2026-07-15',
    status: 'served',
    waitTime: 22,
    serviceTime: 12,
    rating: 4,
  },
  {
    id: 'h3',
    ticketNumber: 'A003',
    service: 'Document Processing',
    branch: 'Abuja Central Office',
    date: '2026-07-10',
    status: 'noshow',
    waitTime: null,
    serviceTime: null,
    rating: null,
  },
  {
    id: 'h4',
    ticketNumber: 'B015',
    service: 'Medical Consultation',
    branch: 'Port Harcourt Branch',
    date: '2026-07-05',
    status: 'served',
    waitTime: 31,
    serviceTime: 15,
    rating: 5,
  },
  {
    id: 'h5',
    ticketNumber: 'A019',
    service: 'Loans & Credit',
    branch: 'Lagos Main Branch',
    date: '2026-06-28',
    status: 'served',
    waitTime: 18,
    serviceTime: 20,
    rating: 3,
  },
]

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className="text-amber-400 hover:scale-110 transition-transform"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >
          {n <= value ? <MdStar size={16} /> : <MdStarBorder size={16} />}
        </button>
      ))}
    </div>
  )
}

export default function QueueHistory() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [ratings, setRatings] = useState({})

  const filtered = MOCK_HISTORY.filter((h) => {
    const matchSearch =
      h.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      h.service.toLowerCase().includes(search.toLowerCase()) ||
      h.branch.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || h.status === filter
    return matchSearch && matchFilter
  })

  const setRating = (id, val) =>
    setRatings((r) => ({ ...r, [id]: val }))

  return (
    <AppLayout>
      <PageHeader
        title="Queue History"
        subtitle="Your past visits and service records"
        breadcrumb="Customer"
        action={
          <Link to="/customer/register">
            <Button icon={<MdAdd size={16} />} size="sm">Join Queue</Button>
          </Link>
        }
      />

      {/* summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total visits',   value: MOCK_HISTORY.length,                                   color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Served',         value: MOCK_HISTORY.filter((h) => h.status === 'served').length, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'No-shows',       value: MOCK_HISTORY.filter((h) => h.status === 'noshow').length, color: 'bg-red-50 text-red-500' },
          {
            label: 'Avg. wait',
            value: (() => {
              const times = MOCK_HISTORY.filter((h) => h.waitTime).map((h) => h.waitTime)
              return times.length ? `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} min` : '—'
            })(),
            color: 'bg-amber-50 text-amber-600',
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-transparent`}>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket, service, or branch…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {['all', 'served', 'noshow'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'served' ? 'Served' : 'No-show'}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<MdHistory size={32} />}
          title="No records found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                h.status === 'served' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'
              }`}>
                {h.status === 'served'
                  ? <MdCheckCircle size={22} />
                  : <MdCancel size={22} />
                }
              </div>

              {/* main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">{h.ticketNumber}</span>
                  <Badge variant={h.status} size="sm">
                    {h.status === 'served' ? 'Served' : 'No-show'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{h.service}</p>
                <p className="text-xs text-slate-400 mt-0.5">{h.branch}</p>
              </div>

              {/* stats */}
              <div className="flex items-center gap-4 text-center shrink-0">
                {h.waitTime && (
                  <div>
                    <p className="text-xs text-slate-400">Wait</p>
                    <p className="text-sm font-bold text-slate-700">{h.waitTime}m</p>
                  </div>
                )}
                {h.serviceTime && (
                  <div>
                    <p className="text-xs text-slate-400">Service</p>
                    <p className="text-sm font-bold text-slate-700">{h.serviceTime}m</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  {h.status === 'served' && (
                    <StarRating
                      value={ratings[h.id] ?? h.rating ?? 0}
                      onChange={(v) => setRating(h.id, v)}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
