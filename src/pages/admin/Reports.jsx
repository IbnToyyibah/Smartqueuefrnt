import { useState } from 'react'
import { MdDownload, MdBarChart } from 'react-icons/md'
import { useNotifications } from '../../context/NotificationContext'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
const PERIODS = ['Daily','Weekly','Monthly']
export default function Reports() {
  const { notify } = useNotifications()
  const [period, setPeriod] = useState('Daily')
  const handleExport = (fmt) => notify('success', `Exporting ${fmt}`, `${period} report is being generated.`)
  return (
    <AppLayout>
      <PageHeader title="Reports" subtitle="Export queue data for management review" breadcrumb="Branch Admin"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<MdDownload size={14}/>} onClick={() => handleExport('PDF')}>Export PDF</Button>
            <Button variant="secondary" size="sm" icon={<MdDownload size={14}/>} onClick={() => handleExport('Excel')}>Export Excel</Button>
          </div>
        }/>
      <div className="flex gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${period===p?'bg-violet-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <MdBarChart size={48} className="text-violet-200 mx-auto mb-3"/>
        <p className="font-semibold text-slate-600">{period} report preview</p>
        <p className="text-sm text-slate-400 mt-1">Select a date range in Analytics to generate detailed reports.</p>
        <div className="flex gap-3 justify-center mt-5">
          <Button icon={<MdDownload size={15}/>} onClick={() => handleExport('PDF')} className="bg-violet-600 hover:bg-violet-700">Download PDF</Button>
          <Button variant="secondary" icon={<MdDownload size={15}/>} onClick={() => handleExport('Excel')}>Download Excel</Button>
        </div>
      </div>
    </AppLayout>
  )
}
