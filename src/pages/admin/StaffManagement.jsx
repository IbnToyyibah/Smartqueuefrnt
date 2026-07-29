import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAdd, MdEdit, MdDelete, MdPerson, MdEmail,
  MdPhone, MdSearch, MdDashboard, MdCheckCircle,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { userApi, counterApi, branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'

const BLANK = { name: '', email: '', phone: '', counter: '', status: 'active' }

export default function StaffManagement() {
  const { user } = useAuth()
  const { notify } = useNotifications()

  const [staff, setStaff] = useState([])
  const [counters, setCounters] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEdit] = useState(null)
  const [deleteTarget, setDel] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
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
      setLoading(false)
      setStaff([])
      setCounters([])
      return
    }
    Promise.all([userApi.branch(branchId), counterApi.list(branchId)])
      .then(([{ users }, { counters: c }]) => {
        setStaff(users)
        setCounters(c)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [branchId])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAdd = () => { setForm(BLANK); setErrors({}); setAddOpen(true) }
  const openEdit = (m) => {
    setForm({ name: m.name, email: m.email, phone: m.phone || '', counter: '', status: m.status })
    setErrors({})
    setEdit(m)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editTarget) {
        const { user: u } = await userApi.update(editTarget._id, { name: form.name, phone: form.phone, status: form.status })
        setStaff(prev => prev.map(s => s._id === editTarget._id ? u : s))
        notify('success', 'Staff updated', `${form.name} saved.`)
        setEdit(null)
      } else {
        const { user: u } = await userApi.create({ ...form, role: 'staff', branch: branchId, password: 'Staff@123' })
        setStaff(prev => [...prev, u])
        notify('success', 'Staff added', `${form.name} added. Default password: Staff@123`)
        setAddOpen(false)
      }
    } catch (err) {
      notify('error', 'Save failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await userApi.remove(deleteTarget._id)
      setStaff(prev => prev.filter(s => s._id !== deleteTarget._id))
      notify('warning', 'Staff removed', `${deleteTarget.name} removed.`)
      setDel(null)
    } catch (err) {
      notify('error', 'Delete failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls = (err) =>
    `w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 ${err ? 'border-red-300' : 'border-slate-200'}`

  const formBody = (
    <div className="flex flex-col gap-4">
      {[
        { k: 'name', label: 'Full name', icon: <MdPerson size={15} />, type: 'text', ph: 'Staff full name' },
        { k: 'email', label: 'Email', icon: <MdEmail size={15} />, type: 'email', ph: 'staff@branch.com', disabled: !!editTarget },
        { k: 'phone', label: 'Phone', icon: <MdPhone size={15} />, type: 'tel', ph: '+234 800 000 0000' },
      ].map(f => (
        <div key={f.k}>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{f.icon}</span>
            <input type={f.type} value={form[f.k]} placeholder={f.ph} disabled={f.disabled}
              onChange={e => set(f.k, e.target.value)} className={inputCls(errors[f.k])} />
          </div>
          {errors[f.k] && <p className="text-xs text-red-500 mt-1">{errors[f.k]}</p>}
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
        <div className="flex gap-2">
          {['active', 'suspended'].map(s => (
            <button key={s} type="button" onClick={() => set('status', s)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${form.status === s ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout>
      <PageHeader title="Staff & Counters" subtitle="Manage counter agents and assignments"
        breadcrumb="Branch Admin"
        action={<Button icon={<MdAdd size={15} />} onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">Add Staff</Button>} />

      {user?.role === 'super_admin' && branches.length > 0 && (
        <div className="mb-5 max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select branch</label>
          <select value={branchId} onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
          </select>
        </div>
      )}
      {!branchId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 mb-5">
          <p className="font-semibold">No branch selected</p>
          <p className="text-sm mt-1 text-amber-700">Pick a branch to manage staff and counter assignments.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MdPerson size={20} />} label="Total staff" value={staff.length} color="indigo" />
        <StatCard icon={<MdCheckCircle size={20} />} label="Active" value={staff.filter(s => s.status === 'active').length} color="green" />
        <StatCard icon={<MdDashboard size={20} />} label="Counters" value={counters.length} color="blue" />
        <StatCard icon={<MdPerson size={20} />} label="Suspended" value={staff.filter(s => s.status !== 'active').length} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
        <div className="relative">
          <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <AnimatePresence>
            {filtered.map((m, i) => (
              <motion.div key={m._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center px-6 py-4 border-b border-slate-50 hover:bg-slate-50/60 last:border-0">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {m.avatar || m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 sm:hidden">{m.email}</p>
                  </div>
                </div>
                <div className="col-span-3 text-xs text-slate-500 truncate hidden sm:block">{m.email}</div>
                <div className="col-span-2 text-xs text-slate-500 hidden sm:block">{m.phone || '—'}</div>
                <div className="col-span-2 hidden sm:block">
                  <Badge variant={m.status === 'active' ? 'active' : 'closed'} size="sm">{m.status}</Badge>
                </div>
                <div className="col-span-1 flex gap-1 justify-end">
                  <button onClick={() => openEdit(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <MdEdit size={16} />
                  </button>
                  <button onClick={() => setDel(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <MdDelete size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSave} className="bg-violet-600 hover:bg-violet-700" icon={<MdCheckCircle size={15} />}>Save</Button></>}>
        {formBody}
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEdit(null)} title={`Edit — ${editTarget?.name ?? ''}`} size="md"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave} className="bg-violet-600 hover:bg-violet-700" icon={<MdCheckCircle size={15} />}>Save</Button></>}>
        {formBody}
      </Modal>
      <Modal open={!!deleteTarget} onClose={() => setDel(null)} title="Remove Staff Member" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete} icon={<MdDelete size={15} />}>Remove</Button></>}>
        <p className="text-sm text-slate-600">Remove <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </AppLayout>
  )
}
