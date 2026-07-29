import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdLocationOn, MdSearch, MdArrowForward, MdPhone, MdEmail,
  MdLocalHospital, MdAccountBalance, MdStorefront, MdGavel, MdBusiness,
  MdCheckCircle, MdBlock,
} from 'react-icons/md'
import { branchApi } from '../../lib/api'
import PublicLayout from '../../components/layout/PublicLayout'

/* ── Category tabs ── */
const CATS = [
  { value: 'healthcare', label: 'Healthcare', icon: <MdLocalHospital size={14} />, color: 'bg-blue-600' },
  { value: 'retail', label: 'Retail', icon: <MdStorefront size={14} />, color: 'bg-emerald-600' },
  { value: 'government', label: 'Government', icon: <MdGavel size={14} />, color: 'bg-violet-600' },
  { value: 'banking', label: 'Banking', icon: <MdAccountBalance size={14} />, color: 'bg-amber-600' },
  { value: 'all', label: 'All', icon: null, color: 'bg-slate-600' },
]

const CAT_ICON = {
  healthcare: { icon: <MdLocalHospital size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
  retail: { icon: <MdStorefront size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
  government: { icon: <MdGavel size={24} className="text-violet-500" />, bg: 'bg-violet-50' },
  banking: { icon: <MdAccountBalance size={24} className="text-amber-500" />, bg: 'bg-amber-50' },
  other: { icon: <MdBusiness size={24} className="text-slate-400" />, bg: 'bg-slate-50' },
}

const DEPT_COLOR = {
  consultation: 'bg-blue-50 text-blue-700 border-blue-200',
  pharmacy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  xray: 'bg-purple-50 text-purple-700 border-purple-200',
  laboratory: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emergency: 'bg-red-50 text-red-600 border-red-200',
  biscuits: 'bg-orange-50 text-orange-700 border-orange-200',
  sweet: 'bg-pink-50 text-pink-700 border-pink-200',
  chocolate: 'bg-amber-50 text-amber-700 border-amber-200',
  complaints: 'bg-red-50 text-red-600 border-red-200',
  complaint: 'bg-red-50 text-red-600 border-red-200',
  payment: 'bg-green-50 text-green-700 border-green-200',
  account: 'bg-blue-50 text-blue-700 border-blue-200',
  loans: 'bg-violet-50 text-violet-700 border-violet-200',
  payments: 'bg-green-50 text-green-700 border-green-200',
  inquiry: 'bg-slate-50 text-slate-600 border-slate-200',
}

function DeptTag({ service }) {
  const cls = DEPT_COLOR[service.id] ?? 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <MdCheckCircle size={11} /> {service.name}
    </span>
  )
}

/** Compute subscription badge config from a branch object */
function getSubBadge(branch) {
  let status = branch.subscriptionStatus || 'active'
  const now = new Date()
  if (status === 'trial' && branch.trialEndDate && now > new Date(branch.trialEndDate)) {
    status = 'expired'
  }
  if (status === 'active' && branch.subscriptionEndDate && now > new Date(branch.subscriptionEndDate)) {
    status = 'expired'
  }
  if (!status || status === 'active') {
    return { label: 'Active', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', canJoin: true }
  }
  if (status === 'trial') {
    let daysLeft = null
    if (branch.trialEndDate) {
      const ms = new Date(branch.trialEndDate) - new Date()
      daysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
    }
    return {
      label: daysLeft !== null ? `Trial · ${daysLeft}d left` : 'Trial',
      cls: 'bg-amber-50 text-amber-600 border-amber-200',
      canJoin: true,
    }
  }
  if (status === 'expired') {
    return { label: 'Expired', cls: 'bg-red-50 text-red-500 border-red-200', canJoin: false }
  }
  if (status === 'suspended') {
    return { label: 'Suspended', cls: 'bg-red-50 text-red-500 border-red-200', canJoin: false }
  }
  return { label: status, cls: 'bg-slate-50 text-slate-500 border-slate-200', canJoin: true }
}

export default function FindBranch() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('healthcare')

  useEffect(() => {
    branchApi.list()
      .then(({ branches: b }) => setBranches(b))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = branches.filter(b => {
    const m = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase())
    return m && (cat === 'all' || b.category === cat)
  })

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/40 to-white px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
            <h1 className="text-2xl font-extrabold text-slate-900">Find a Branch</h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a category, select your branch, and join the queue instantly.
            </p>
          </motion.div>

          {/* Category tab pills */}
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {CATS.map(c => (
              <button key={c.value} onClick={() => setCat(c.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${cat === c.value
                  ? `${c.color} text-white border-transparent`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}>
                {c.icon && <span>{c.icon}</span>}
                {c.label}
                <span className={`text-xs ml-1 ${cat === c.value ? 'text-white/70' : 'text-slate-400'}`}>
                  {c.value === 'all' ? branches.length : branches.filter(b => b.category === c.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 p-3 mb-6">
            <div className="relative">
              <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or city…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {/* Branch list */}
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14">
              <MdLocationOn size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-600">No branches found</p>
              <p className="text-sm text-slate-400 mt-1">Try a different category or search term.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col gap-4">
                {filtered.map((b, i) => {
                  const catCfg = CAT_ICON[b.category] ?? CAT_ICON.other
                  const activeDepts = (b.services || []).filter(s => s.active)
                  const subBadge = getSubBadge(b)
                  return (
                    <motion.div key={b._id} layout
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                      className={`bg-white rounded-2xl border overflow-hidden ${!subBadge.canJoin ? 'border-red-100 opacity-80' : 'border-slate-100'}`}>

                      {/* Branch header */}
                      <div className="flex items-start gap-4 p-5 pb-3">
                        <div className={`w-12 h-12 ${catCfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          {catCfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-slate-800 text-base">{b.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MdLocationOn size={11} />{b.city}{b.address ? ` — ${b.address}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Operational status */}
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${b.status === 'operational' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                b.status === 'degraded' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  'bg-red-50 text-red-500 border-red-200'}`}>
                                {b.status === 'operational' ? 'Open' : b.status}
                              </span>
                              {/* Subscription status badge */}
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${subBadge.cls}`}>
                                {subBadge.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Departments */}
                      {activeDepts.length > 0 && (
                        <div className="px-5 pb-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Departments</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeDepts.map(s => <DeptTag key={s.id} service={s} />)}
                          </div>
                        </div>
                      )}

                      {/* Contact + CTA */}
                      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-50 bg-slate-50/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {b.phone && (
                            <a href={`tel:${b.phone}`} className="text-xs text-slate-400 flex items-center gap-1 hover:text-violet-600 transition-colors">
                              <MdPhone size={12} />{b.phone}
                            </a>
                          )}
                          {b.email && (
                            <a href={`mailto:${b.email}`} className="hidden sm:flex text-xs text-slate-400 items-center gap-1 hover:text-violet-600 transition-colors">
                              <MdEmail size={12} />{b.email}
                            </a>
                          )}
                        </div>
                        {subBadge.canJoin ? (
                          <Link to={`/join-queue?branch=${b._id}`}
                            className="shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                            Join Queue <MdArrowForward size={13} />
                          </Link>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-semibold px-4 py-2 rounded-xl border border-red-200 cursor-not-allowed">
                            <MdBlock size={13} /> Cannot join — subscription expired
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
