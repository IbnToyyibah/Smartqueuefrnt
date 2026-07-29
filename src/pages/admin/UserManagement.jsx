import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdPerson, MdAdd, MdEdit, MdDelete, MdSearch, MdEmail, MdPhone, MdCheckCircle, MdLock } from 'react-icons/md'
import { useNotifications } from '../../context/NotificationContext'
import { userApi, branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'

const ROLE_LABEL = { customer: 'Customer', staff: 'Counter Agent', branch_admin: 'Branch Admin', super_admin: 'Super Admin' }
const BLANK = { name: '', email: '', phone: '', role: 'customer', branch: '', status: 'active' }

export default function UserManagement() {
  const { notify } = useNotifications()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [roleF, setRoleF] = useState('all')
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEdit] = useState(null)
  const [deleteTarget, setDel] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([userApi.list(), branchApi.list()])
      .then(([{ users: u }, { branches: b }]) => { setUsers(u); setBranches(b) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }
  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required'
    setErrors(errs); return Object.keys(errs).length === 0
  }

  const openAdd = () => { setForm(BLANK); setErrors({}); setAddOpen(true) }
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, branch: u.branch?._id || u.branch || '', status: u.status }); setErrors({}); setEdit(u) }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editTarget) {
        const { user: u } = await userApi.update(editTarget._id, { name: form.name, phone: form.phone, role: form.role, branch: form.branch || null, status: form.status })
        setUsers(prev => prev.map(x => x._id === editTarget._id ? u : x))
        notify('success', 'User updated', `${form.name} saved.`)
        setEdit(null)
      } else {
        const { user: u } = await userApi.create({ ...form, password: 'SmartQueue@123' })
        setUsers(prev => [...prev, u])
        notify('success', 'User created', `${form.name} added. Default password: SmartQueue@123`)
        setAddOpen(false)
      }
    } catch (err) {
      notify('error', 'Save failed', err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await userApi.remove(deleteTarget._id)
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id))
      notify('warning', 'User removed', `${deleteTarget.name} removed.`)
      setDel(null)
    } catch (err) {
      notify('error', 'Delete failed', err.message)
    } finally { setSaving(false) }
  }

  const filtered = users.filter(u => {
    const m = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return m && (roleF === 'all' || u.role === roleF)
  })

  const inputCls = (err) =>
    `w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 ${err ? 'border-red-300' : 'border-slate-200'}`

  const formBody = (
    <div className="flex flex-col gap-4">
      {[
        { k: 'name', label: 'Full name', icon: <MdPerson size={15} />, type: 'text', ph: 'Full name' },
        { k: 'email', label: 'Email', icon: <MdEmail size={15} />, type: 'email', ph: 'user@email.com', disabled: !!editTarget },
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
        <div className="relative">
          <MdLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
            {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {['staff', 'branch_admin'].includes(form.role) && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch</label>
          <select value={form.branch} onChange={e => set('branch', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Select branch…</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      )}
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
      <PageHeader title="User Management" subtitle="Manage all platform users and roles"
        breadcrumb="Super Admin"
        action={<Button icon={<MdAdd size={15} />} onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">Add User</Button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MdPerson size={20} />} label="Total users" value={users.length} color="indigo" />
        <StatCard icon={<MdCheckCircle size={20} />} label="Active" value={users.filter(u => u.status === 'active').length} color="green" />
        <StatCard icon={<MdPerson size={20} />} label="Staff/Admins" value={users.filter(u => u.role !== 'customer').length} color="blue" />
        <StatCard icon={<MdPerson size={20} />} label="Suspended" value={users.filter(u => u.status === 'suspended').length} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'customer', 'staff', 'branch_admin', 'super_admin'].map(r => (
            <button key={r} onClick={() => setRoleF(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${roleF === r ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {r === 'all' ? 'All' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <div className="col-span-3">Name</div><div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div><div className="col-span-2">Branch</div>
            <div className="col-span-1">Status</div><div className="col-span-1 text-right">Actions</div>
          </div>
          <AnimatePresence>
            {filtered.map((u, i) => (
              <motion.div key={u._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-6 py-4 border-b border-slate-50 hover:bg-slate-50/60 last:border-0">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {(u.avatar || u.name.split(' ').map(n => n[0]).join('').toUpperCase()).slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                  </div>
                </div>
                <div className="col-span-3 text-xs text-slate-500 truncate hidden md:block">{u.email}</div>
                <div className="col-span-2 hidden md:block"><Badge variant={u.role} size="sm">{ROLE_LABEL[u.role]}</Badge></div>
                <div className="col-span-2 text-xs text-slate-500 truncate hidden md:block">{u.branch?.name || '—'}</div>
                <div className="col-span-1 hidden md:block">
                  <Badge variant={u.status === 'active' ? 'active' : 'noshow'} size="sm">{u.status}</Badge>
                </div>
                <div className="col-span-1 flex gap-1 justify-end">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><MdEdit size={16} /></button>
                  <button onClick={() => setDel(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><MdDelete size={16} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User" size="md"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSave} className="bg-violet-600 hover:bg-violet-700" icon={<MdCheckCircle size={15} />}>Create User</Button></>}>
        {formBody}
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEdit(null)} title={`Edit — ${editTarget?.name ?? ''}`} size="md"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave} className="bg-violet-600 hover:bg-violet-700" icon={<MdCheckCircle size={15} />}>Save</Button></>}>
        {formBody}
      </Modal>
      <Modal open={!!deleteTarget} onClose={() => setDel(null)} title="Remove User" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete} icon={<MdDelete size={15} />}>Remove</Button></>}>
        <p className="text-sm text-slate-600">Permanently remove <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </AppLayout>
  )
}
