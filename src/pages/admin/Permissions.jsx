import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
const PERMS = [
  { role:'customer',     label:'Customer',     can:['Join queue','Track queue','View branch info','Rate service'] },
  { role:'staff',        label:'Counter Agent',can:['Call next','Mark served','Mark no-show','Skip','Recall','Transfer','View queue'] },
  { role:'branch_admin', label:'Branch Admin', can:['All staff permissions','Manage staff','Manage counters','Manage services','View analytics','Export reports','Edit branch settings'] },
  { role:'super_admin',  label:'Super Admin',  can:['All permissions','Manage branches','Manage users','Configure permissions','View audit logs','System settings'] },
]
export default function Permissions() {
  return (
    <AppLayout>
      <PageHeader title="Permissions" subtitle="Role-based access control overview" breadcrumb="Super Admin"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PERMS.map(p => (
          <div key={p.role} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={p.role} size="md">{p.label}</Badge>
            </div>
            <ul className="flex flex-col gap-1.5">
              {p.can.map(c => (
                <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0"/>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
