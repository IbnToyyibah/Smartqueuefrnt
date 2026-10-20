import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import { authApi } from '../../lib/api'

const STATIC_ROLES = [
  { role: 'customer', label: 'Customer', scope: 'Self-service' },
  { role: 'staff', label: 'Counter Agent', scope: 'Assigned Branch' },
  { role: 'branch_admin', label: 'Branch Admin', scope: 'Single Branch' },
  { role: 'super_admin', label: 'Super Admin', scope: 'Global / Multi-Branch' },
]

export default function Permissions() {
  const [permissionsData, setPermissionsData] = useState(null)
  const [, setLoading] = useState(true)

  useEffect(() => {
    authApi.permissions()
      .then((data) => {
        setPermissionsData(data)
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic permissions matrix:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const rolePermissions = permissionsData?.rolePermissions || {
    customer: ['queue:join', 'queue:view_own', 'branch:view'],
    staff: ['queue:join', 'queue:view_own', 'queue:view_branch', 'queue:call', 'queue:serve', 'queue:noshow', 'queue:transfer', 'queue:skip', 'queue:recall', 'branch:view'],
    branch_admin: ['queue:*', 'branch:manage', 'branch:settings', 'services:manage', 'counters:manage', 'staff:manage', 'analytics:view', 'reports:export'],
    super_admin: ['* (All System Permissions)'],
  }

  return (
    <AppLayout>
      <PageHeader
        title="Role & Access Control System"
        subtitle="Server-enforced RBAC, branch multi-tenancy, and security status"
        breadcrumb="Super Admin"
      />

      {/* Security Architecture Verification Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">REST API Guards</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Per-Endpoint Role Check</p>
          <p className="text-xs text-slate-500 mt-1">Backend validates JWT & DB role on every REST call.</p>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Multi-Tenancy</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Branch Scope Isolation</p>
          <p className="text-xs text-slate-500 mt-1">`requireOwnBranch` prevents cross-tenant data access.</p>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Socket Security</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Authorized Room Joins</p>
          <p className="text-xs text-slate-500 mt-1">Socket subscriptions require valid branch credentials.</p>
        </div>

        <div className="bg-white rounded-xl border border-violet-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Session Freshness</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Active Socket Revocation</p>
          <p className="text-xs text-slate-500 mt-1">Suspended or demoted sessions disconnect live.</p>
        </div>
      </div>

      {/* Role Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {STATIC_ROLES.map(({ role, label, scope }) => {
          const perms = rolePermissions[role] || []
          return (
            <div key={role} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={role} size="md">{label}</Badge>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                  {scope}
                </span>
              </div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Granted Permissions</p>
              <ul className="flex flex-col gap-1.5">
                {perms.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
