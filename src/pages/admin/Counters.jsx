import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MdAdd, MdEdit, MdDelete, MdPause, MdPlayArrow, MdCheckCircle } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { branchApi, counterApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
export default function Counters() {
  const { user }   = useAuth()
  const { notify } = useNotifications()
  const [branches, setBranches] = useState([])
  const [counters, setCounters] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [addOpen,  setAddOpen]  = useState(false)
  const [form,     setForm]     = useState({ name: '' })
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
      setCounters([])
      return
    }
    setLoading(true)
    counterApi.list(branchId).then(({ counters: c }) => setCounters(c)).catch(console.error).finally(() => setLoading(false))
  }, [branchId])

  const handleAdd = async () => {
    if (!form.name.trim()) return
    const { counter } = await counterApi.create({ name: form.name, branch: branchId })
    setCounters(prev => [...prev, counter])
    notify('success', 'Counter added', form.name)
    setAddOpen(false); setForm({ name: '' })
  }
  const handleToggle = async (id) => {
    const { counter } = await counterApi.toggle(id)
    setCounters(prev => prev.map(c => c._id === id ? counter : c))
    notify('info', counter.status === 'active' ? 'Resumed' : 'Paused', counter.name)
  }
  const handleDelete = async (id, name) => {
    await counterApi.remove(id)
    setCounters(prev => prev.filter(c => c._id !== id))
    notify('warning', 'Counter removed', name)
  }
  return (
    <AppLayout>
      <PageHeader title="Counters" subtitle="Open, close, pause and assign staff to counters" breadcrumb="Branch Admin"
        action={<Button icon={<MdAdd size={15}/>} onClick={() => setAddOpen(true)} className="bg-violet-600 hover:bg-violet-700">Add Counter</Button>}/>
      {user?.role === 'super_admin' && branches.length > 0 && (
        <div className="mb-5 max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select branch</label>
          <select
            value={branchId}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {!branchId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-semibold">No branch assigned</p>
          <p className="text-sm mt-1 text-amber-700">
            This dashboard needs a branch before counters can load. Assign a branch to your account or pick one if you are a super admin.
          </p>
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map(c => (
            <motion.div key={c._id} layout initial={{ opacity:0 }} animate={{ opacity:1 }}
              className={`rounded-2xl border-2 p-5 ${c.status==='active'?'border-emerald-200 bg-emerald-50/30':c.status==='paused'?'border-amber-200 bg-amber-50/30':'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-slate-800">{c.name}</p>
                <Badge variant={c.status==='active'?'active':c.status==='paused'?'warning':'closed'} size="sm">{c.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-3">{c.agent?.name ?? 'Unassigned'}</p>
              <div className="flex gap-2">
                {c.status !== 'closed' && (
                  <Button size="sm" variant={c.status==='active'?'warning':'success'} onClick={() => handleToggle(c._id)}
                    icon={c.status==='active'?<MdPause size={13}/>:<MdPlayArrow size={13}/>}>
                    {c.status==='active'?'Pause':'Resume'}
                  </Button>
                )}
                <Button size="sm" variant="danger" icon={<MdDelete size={13}/>} onClick={() => handleDelete(c._id, c.name)}>Remove</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Counter" size="sm"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} className="bg-violet-600 hover:bg-violet-700" icon={<MdCheckCircle size={14}/>}>Add</Button></>}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Counter name</label>
          <input value={form.name} onChange={e => setForm({name:e.target.value})} placeholder="e.g. Counter 5"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
        </div>
      </Modal>
    </AppLayout>
  )
}
