import { useEffect, useState } from 'react'
import { MdAdd, MdSave, MdDelete } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
export default function Services() {
  const { user }   = useAuth()
  const { notify } = useNotifications()
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)
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
      setServices([])
      return
    }
    branchApi.get(branchId).then(({ branch: b }) => setServices(b.services || [])).catch(console.error).finally(() => setLoading(false))
  }, [branchId])
  const toggle = (id) => setServices(prev => prev.map(s => s.id===id ? {...s, active:!s.active} : s))
  const setDuration = (id, val) => setServices(prev => prev.map(s => s.id===id ? {...s, duration:Number(val)} : s))
  const handleSave = async () => {
    await branchApi.update(branchId, { services })
    notify('success', 'Services saved', 'Service list updated.')
  }
  return (
    <AppLayout>
      <PageHeader title="Services" subtitle="Manage services offered at this branch" breadcrumb="Branch Admin"
        action={<Button icon={<MdSave size={15}/>} onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>}/>
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
          <p className="text-sm mt-1 text-amber-700">Pick a branch to manage its services.</p>
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/></div> : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1">On</div>
            <div className="col-span-6">Service Name</div>
            <div className="col-span-3">Avg Duration</div>
            <div className="col-span-2">Status</div>
          </div>
          {services.map(s => (
            <div key={s.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-slate-50 last:border-0">
              <div className="col-span-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={s.active} onChange={() => toggle(s.id)} className="sr-only peer"/>
                  <div className="w-8 h-4 bg-slate-200 peer-checked:bg-violet-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"/>
                </label>
              </div>
              <div className="col-span-6 text-sm font-medium text-slate-800">{s.name}</div>
              <div className="col-span-3 flex items-center gap-1">
                <input type="number" min="1" max="120" value={s.duration} onChange={e => setDuration(s.id, e.target.value)}
                  className="w-14 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-violet-400"/>
                <span className="text-xs text-slate-400">min</span>
              </div>
              <div className="col-span-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.active?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-400'}`}>
                  {s.active?'Active':'Off'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
