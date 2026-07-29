import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../context/QueueContext'
import { branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import { MdPeople } from 'react-icons/md'
const STATUS_CLR = { waiting:'bg-amber-100 text-amber-700', checked_in:'bg-blue-100 text-blue-700', called:'bg-indigo-100 text-indigo-700', serving:'bg-violet-100 text-violet-700', served:'bg-green-100 text-green-700', noshow:'bg-red-100 text-red-500', skipped:'bg-slate-100 text-slate-500' }
export default function AdminQueueList() {
  const { user }   = useAuth()
  const { queue, loadBranchData, loading } = useQueue()
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
    if (!branchId) return
    loadBranchData(branchId)
  }, [branchId])

  const active = queue.filter(t => ['waiting','checked_in','called','serving'].includes(t.status))
  return (
    <AppLayout>
      <PageHeader title="Queues" subtitle="Live queue for this branch" breadcrumb="Branch Admin"/>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-semibold">No branch selected</p>
          <p className="text-sm mt-1 text-amber-700">Pick a branch to view the live queue.</p>
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/></div> : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Token</div><div className="col-span-3">Name</div>
            <div className="col-span-3">Service</div><div className="col-span-2">Status</div><div className="col-span-2">Wait</div>
          </div>
          {active.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><MdPeople size={36} className="mx-auto mb-2 opacity-30"/><p>Queue is empty</p></div>
          ) : active.map(t => (
            <div key={t._id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-slate-50 last:border-0">
              <div className="col-span-2 font-mono font-bold text-slate-800">{t.ticketNumber}</div>
              <div className="col-span-3 text-sm text-slate-700 truncate">{t.name}</div>
              <div className="col-span-3 text-xs text-slate-500 truncate">{t.service?.label}</div>
              <div className="col-span-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLR[t.status]??STATUS_CLR.waiting}`}>{t.status.replace('_',' ')}</span></div>
              <div className="col-span-2 text-xs text-slate-400">{t.estimatedWait}m</div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
