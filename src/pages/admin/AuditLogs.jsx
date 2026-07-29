import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
export default function AuditLogs() {
  const logs = [
    { user:'Fatima S.',  action:'Added branch — Ibadan Office',           time:'5 min ago',  ip:'192.168.1.10' },
    { user:'Chidi O.',   action:'Updated Counter 3 settings',             time:'12 min ago', ip:'192.168.1.12' },
    { user:'Amira B.',   action:'Marked ticket A104 as served',           time:'18 min ago', ip:'192.168.1.14' },
    { user:'Fatima S.',  action:'Created staff user — Seun Adeyemi',      time:'1 hr ago',   ip:'192.168.1.10' },
    { user:'Tunde B.',   action:'Paused Counter 3',                       time:'2 hr ago',   ip:'192.168.1.11' },
    { user:'Chidi O.',   action:'Exported analytics report (PDF)',        time:'3 hr ago',   ip:'192.168.1.12' },
  ]
  return (
    <AppLayout>
      <PageHeader title="Audit Logs" subtitle="All admin and staff actions recorded" breadcrumb="Super Admin"/>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2">User</div>
          <div className="col-span-6">Action</div>
          <div className="col-span-2">IP</div>
          <div className="col-span-2">Time</div>
        </div>
        {logs.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/60 last:border-0 text-sm">
            <div className="col-span-2 font-semibold text-slate-800">{l.user}</div>
            <div className="col-span-6 text-slate-600">{l.action}</div>
            <div className="col-span-2 text-xs text-slate-400 font-mono">{l.ip}</div>
            <div className="col-span-2 text-xs text-slate-400">{l.time}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
