import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdBusiness, MdAdd, MdEdit, MdDelete, MdSearch,
  MdLocationOn, MdPeople, MdDashboard, MdCheckCircle,
  MdLocalHospital, MdAccountBalance, MdStorefront, MdGavel,
  MdBlock,
} from 'react-icons/md'
import { useNotifications } from '../../context/NotificationContext'
import { branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'

/* ── Category config ── */
const CATEGORIES = [
  { value: 'all', label: 'All', icon: null },
  { value: 'healthcare', label: 'Healthcare', icon: <MdLocalHospital size={14} /> },
  { value: 'government', label: 'Government', icon: <MdGavel size={14} /> },
  { value: 'retail', label: 'Retail', icon: <MdStorefront size={14} /> },
  { value: 'banking', label: 'Banking', icon: <MdAccountBalance size={14} /> },
  { value: 'other', label: 'Other', icon: <MdBusiness size={14} /> },
]

const CATEGORY_ICON = {
  healthcare: <MdLocalHospital size={18} className="text-blue-500" />,
  government: <MdGavel size={18} className="text-violet-500" />,
  retail: <MdStorefront size={18} className="text-emerald-500" />,
  banking: <MdAccountBalance size={18} className="text-amber-500" />,
  other: <MdBusiness size={18} className="text-slate-400" />,
}

const BLANK = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  counters: 3,
  category: 'healthcare',
  status: 'operational',
  billing_details: {
    card_holder: '',
    card_last4: '',
    card_expiry: '',
  },
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500'

const getSubscriptionLabel = (branch) => {
  const status = branch.subscriptionStatus || 'active'
  if (status === 'trial') return 'Trial'
  if (status === 'active') return 'Subscribed'
  if (status === 'suspended') return 'Suspended'
  return 'Expired'
}

const subscriptionBadge = (branch) => {
  const status = branch.subscriptionStatus || 'active'
  if (status === 'active') return 'active'
  if (status === 'trial') return 'warning'
  return 'error'
}

export default function AllBranches() {
  const { notify } = useNotifications()

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEdit] = useState(null)
  const [deleteTarget, setDel] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})

  /* ── Load branches from real API ── */
  useEffect(() => {
    branchApi.list()
      .then(({ branches: b }) => setBranches(b))
      .catch(() => notify('error', 'Failed to load branches', 'Check your connection.'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Branch name is required.'
    if (!form.city.trim()) errs.city = 'City is required.'
    if (!form.address.trim()) errs.address = 'Address is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAdd = () => { setForm(BLANK); setErrors({}); setAddOpen(true) }
  const openEdit = (b) => {
    setForm({
      name: b.name, city: b.city, address: b.address,
      phone: b.phone || '', email: b.email || '',
      counters: b.counters || 3, category: b.category || 'other', status: b.status,
      billing_details: {
        card_holder: b.billing_details?.card_holder || '',
        card_last4: b.billing_details?.card_last4 || '',
        card_expiry: b.billing_details?.card_expiry || '',
      },
    })
    setErrors({})
    setEdit(b)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editTarget) {
        const { branch } = await branchApi.update(editTarget._id, form)
        setBranches(prev => prev.map(b => b._id === editTarget._id ? branch : b))
        notify('success', 'Branch updated', `${branch.name} saved.`)
        setEdit(null)
      } else {
        const { branch } = await branchApi.create(form)
        setBranches(prev => [...prev, branch])
        notify('success', 'Branch added', `${branch.name} is now on the platform.`)
        setAddOpen(false)
      }
    } catch (err) {
      notify('error', 'Save failed', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await branchApi.remove(deleteTarget._id)
      setBranches(prev => prev.filter(b => b._id !== deleteTarget._id))
      notify('warning', 'Branch removed', `${deleteTarget.name} removed from the platform.`)
      setDel(null)
    } catch (err) {
      notify('error', 'Delete failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubscription = async (branch, subscriptionStatus) => {
    setSaving(true)
    try {
      const payload = { subscriptionStatus }
      if (subscriptionStatus === 'active') {
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)
        payload.subscriptionEndDate = endDate.toISOString()
      }
      const { branch: updated } = await branchApi.updateSubscription(branch._id, payload)
      setBranches(prev => prev.map(b => b._id === updated._id ? updated : b))
      notify('success', 'Subscription updated', `${updated.name} is now ${getSubscriptionLabel(updated).toLowerCase()}.`)
    } catch (err) {
      notify('error', 'Subscription update failed', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Filtered list ── */
  const filtered = branches.filter(b => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || b.category === catFilter
    return matchSearch && matchCat
  })

  /* ── Form body (shared add/edit) ── */
  const formBody = (
    <div className="flex flex-col gap-4">
      {form.billing_details && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Saved Billing Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-slate-400">Card holder</p>
              <input
                type="text"
                value={form.billing_details.card_holder}
                onChange={(e) => set('billing_details', { ...form.billing_details, card_holder: e.target.value })}
                placeholder="Name on card"
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Card last 4</p>
              <input
                type="text"
                value={form.billing_details.card_last4}
                onChange={(e) => set('billing_details', { ...form.billing_details, card_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
                className={`${inputCls} font-mono tracking-widest`}
              />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Expiry</p>
              <input
                type="text"
                value={form.billing_details.card_expiry}
                onChange={(e) => set('billing_details', { ...form.billing_details, card_expiry: e.target.value })}
                placeholder="MM/YY"
                inputMode="numeric"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.filter(c => c.value !== 'all').map(c => (
            <button key={c.value} type="button" onClick={() => set('category', c.value)}
              className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${form.category === c.value
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-violet-300'
                }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      {[
        { k: 'name', label: 'Branch name', type: 'text', ph: 'e.g. Lagos Main Branch' },
        { k: 'city', label: 'City', type: 'text', ph: 'e.g. Lagos' },
        { k: 'address', label: 'Full address', type: 'text', ph: 'Street address' },
        { k: 'phone', label: 'Phone (optional)', type: 'tel', ph: '+234 1 234 5678' },
        { k: 'email', label: 'Email (optional)', type: 'email', ph: 'branch@org.com' },
        { k: 'counters', label: 'Number of counters', type: 'number', ph: '1–20' },
      ].map(f => (
        <div key={f.k}>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
          <input type={f.type} value={form[f.k]} placeholder={f.ph}
            onChange={e => set(f.k, f.type === 'number' ? Number(e.target.value) : e.target.value)}
            className={`${inputCls} ${errors[f.k] ? 'border-red-300' : ''}`} />
          {errors[f.k] && <p className="text-xs text-red-500 mt-1">{errors[f.k]}</p>}
        </div>
      ))}

      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
        <div className="flex gap-2">
          {['operational', 'degraded', 'offline'].map(s => (
            <button key={s} type="button" onClick={() => set('status', s)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${form.status === s
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-violet-300'
                }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout>
      <PageHeader title="All Branches" subtitle="Add and manage branches across every location"
        breadcrumb="Super Admin"
        action={
          <Button icon={<MdAdd size={16} />} onClick={openAdd}
            className="bg-violet-600 hover:bg-violet-700">
            Add Branch
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MdBusiness size={20} />} label="Total branches" value={branches.length} color="indigo" />
        <StatCard icon={<MdCheckCircle size={20} />} label="Operational" value={branches.filter(b => b.status === 'operational').length} color="green" />
        <StatCard icon={<MdDashboard size={20} />} label="Degraded" value={branches.filter(b => b.status === 'degraded').length} color="amber" />
        <StatCard icon={<MdPeople size={20} />} label="Offline" value={branches.filter(b => b.status === 'offline').length} color="rose" />
      </div>

      {/* Search + category filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${catFilter === c.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
              {c.icon && <span>{c.icon}</span>}
              {c.label}
              <span className={`ml-0.5 ${catFilter === c.value ? 'text-violet-200' : 'text-slate-400'}`}>
                {c.value === 'all'
                  ? branches.length
                  : branches.filter(b => b.category === c.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Branch cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MdBusiness size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No branches found</p>
          <p className="text-sm mt-1">Try a different filter or add a new branch.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((b, i) => (
              <motion.div key={b._id} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border-2 p-5 ${b.status === 'operational' ? 'border-emerald-200 bg-emerald-50/30' :
                    b.status === 'degraded' ? 'border-amber-200 bg-amber-50/30' :
                      'border-red-200 bg-red-50/30'
                  }`}>

                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      {CATEGORY_ICON[b.category] ?? CATEGORY_ICON.other}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MdLocationOn size={11} />{b.address || b.city}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                        {b.category || 'other'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={b.status === 'operational' ? 'active' : b.status === 'degraded' ? 'warning' : 'error'}
                    size="sm">
                    {b.status}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/80 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400">City</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{b.city}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2.5 text-center border border-slate-100">
                    <p className="text-[10px] text-slate-400">Services</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {b.services?.filter(s => s.active).length ?? 0} active
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 bg-white/80 rounded-xl p-2.5 border border-slate-100 mb-3">
                  <p className="text-xs font-semibold text-slate-500">Subscription</p>
                  <Badge variant={subscriptionBadge(b)} size="sm">{getSubscriptionLabel(b)}</Badge>
                </div>

                {b.billing_details && (
                  <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100 mb-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-500 mb-1">Saved card</p>
                    <p>{b.billing_details.card_holder || 'Card holder not set'}</p>
                    <p>{b.billing_details.card_last4 ? `•••• ${b.billing_details.card_last4}` : 'Card number not saved'}</p>
                    <p>{b.billing_details.card_expiry || 'Expiry not set'}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon={<MdEdit size={14} />} onClick={() => openEdit(b)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="success" icon={<MdCheckCircle size={14} />}
                    onClick={() => handleSubscription(b, 'active')} disabled={saving}>
                    Approve
                  </Button>
                  <Button size="sm" variant="warning" icon={<MdBlock size={14} />}
                    onClick={() => handleSubscription(b, 'suspended')} disabled={saving}>
                    Suspend
                  </Button>
                  <Button size="sm" variant="danger" icon={<MdDelete size={14} />} onClick={() => setDel(b)}>
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Branch" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}
              className="bg-violet-600 hover:bg-violet-700"
              icon={<MdCheckCircle size={15} />}>
              Add Branch
            </Button>
          </>
        }>
        {formBody}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEdit(null)}
        title={`Edit — ${editTarget?.name ?? ''}`} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}
              className="bg-violet-600 hover:bg-violet-700"
              icon={<MdCheckCircle size={15} />}>
              Save Changes
            </Button>
          </>
        }>
        {formBody}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDel(null)} title="Remove Branch" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" loading={saving} onClick={handleDelete} icon={<MdDelete size={15} />}>
              Remove
            </Button>
          </>
        }>
        <p className="text-sm text-slate-600">
          Remove <strong>{deleteTarget?.name}</strong> from the platform?
          All branch data and queues will be archived.
        </p>
      </Modal>
    </AppLayout>
  )
}
