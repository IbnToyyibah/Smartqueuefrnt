import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

/* ── Public pages ── */
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

/* ── Public customer flow (no login needed) ── */
const CustomerHome = lazy(() => import('./pages/customer/CustomerHome'))
const PublicJoinQueue = lazy(() => import('./pages/customer/PublicJoinQueue'))
const PublicTrack = lazy(() => import('./pages/customer/PublicTrack'))
const FindBranch = lazy(() => import('./pages/customer/FindBranch'))

/* ── Queue display boards (public TV screens) ── */
const Queue1 = lazy(() => import('./pages/display/Queue1'))
const Queue2 = lazy(() => import('./pages/display/Queue2'))
const Queue3 = lazy(() => import('./pages/display/Queue3'))
const Queue4 = lazy(() => import('./pages/display/Queue4'))

/* ── Authenticated customer ── */
const LiveTracking = lazy(() => import('./pages/customer/LiveTracking'))
const QueueHistory = lazy(() => import('./pages/customer/QueueHistory'))

/* ── Staff ── */
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'))
const StaffQueueList = lazy(() => import('./pages/staff/StaffQueueList'))

/* ── Branch Admin ── */
const BranchOverview = lazy(() => import('./pages/admin/BranchOverview'))
const AdminQueueList = lazy(() => import('./pages/admin/AdminQueueList'))
const Counters = lazy(() => import('./pages/admin/Counters'))
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'))
const Services = lazy(() => import('./pages/admin/Services'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const BranchSettings = lazy(() => import('./pages/admin/BranchSettings'))

/* ── Super Admin ── */
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'))
const AllBranches = lazy(() => import('./pages/admin/AllBranches'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const Permissions = lazy(() => import('./pages/admin/Permissions'))
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'))
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'))

/* ──────────────────────────────────────────
   Route guards
────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireGuest({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={roleHome(user.role)} replace />
  return children
}

function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />
  return children
}

function roleHome(role) {
  return { customer: '/customer', staff: '/staff/dashboard', branch_admin: '/admin/branch', super_admin: '/admin/super' }[role] ?? '/'
}

/** /admin/settings — different page per role */
function SettingsRouter() {
  const { user } = useAuth()
  if (user?.role === 'super_admin') return <SystemSettings />
  if (user?.role === 'branch_admin') return <BranchSettings />
  return <Navigate to={roleHome(user?.role ?? '')} replace />
}

/* ──────────────────────────────────────────
   Routes
────────────────────────────────────────── */
export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── Landing ── */}
        <Route path="/" element={<Landing />} />

        {/* ── Public customer flow — NO AUTH NEEDED ── */}
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/join-queue" element={<PublicJoinQueue />} />
        <Route path="/track" element={<PublicTrack />} />
        <Route path="/find-branch" element={<FindBranch />} />

        {/* ── Queue display boards — public ── */}
        <Route path="/queue" element={<Queue1 />} />
        <Route path="/queue2" element={<Queue2 />} />
        <Route path="/queue3" element={<Queue3 />} />
        <Route path="/queue4" element={<Queue4 />} />

        {/* ── Auth ── */}
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />

        {/* ── Authenticated customer extras ── */}
        <Route path="/customer/track" element={<RequireAuth><RequireRole roles={['customer']}><LiveTracking /></RequireRole></RequireAuth>} />
        <Route path="/customer/history" element={<RequireAuth><RequireRole roles={['customer']}><QueueHistory /></RequireRole></RequireAuth>} />

        {/* ── Staff ── */}
        <Route path="/staff/dashboard" element={<RequireAuth><RequireRole roles={['staff']}><StaffDashboard /></RequireRole></RequireAuth>} />
        <Route path="/staff/queue" element={<RequireAuth><RequireRole roles={['staff']}><StaffQueueList /></RequireRole></RequireAuth>} />
        <Route path="/staff/history" element={<RequireAuth><RequireRole roles={['staff']}><QueueHistory /></RequireRole></RequireAuth>} />

        {/* ── Branch Admin ── */}
        <Route path="/admin/branch" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><BranchOverview /></RequireRole></RequireAuth>} />
        <Route path="/admin/queues" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><AdminQueueList /></RequireRole></RequireAuth>} />
        <Route path="/admin/counters" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><Counters /></RequireRole></RequireAuth>} />
        <Route path="/admin/staff" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><StaffManagement /></RequireRole></RequireAuth>} />
        <Route path="/admin/services" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><Services /></RequireRole></RequireAuth>} />
        <Route path="/admin/analytics" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><Analytics /></RequireRole></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth><RequireRole roles={['branch_admin', 'super_admin']}><Reports /></RequireRole></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth><SettingsRouter /></RequireAuth>} />

        {/* ── Super Admin ── */}
        <Route path="/admin/super" element={<RequireAuth><RequireRole roles={['super_admin']}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
        <Route path="/admin/branches" element={<RequireAuth><RequireRole roles={['super_admin']}><AllBranches /></RequireRole></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><RequireRole roles={['super_admin']}><UserManagement /></RequireRole></RequireAuth>} />
        <Route path="/admin/permissions" element={<RequireAuth><RequireRole roles={['super_admin']}><Permissions /></RequireRole></RequireAuth>} />
        <Route path="/admin/audit" element={<RequireAuth><RequireRole roles={['super_admin']}><AuditLogs /></RequireRole></RequireAuth>} />
        <Route path="/admin/system" element={<RequireAuth><RequireRole roles={['super_admin']}><SystemSettings /></RequireRole></RequireAuth>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      Loading...
    </div>
  )
}

function NotFound() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-6 max-w-sm">The page you are looking for doesn't exist or you don't have permission.</p>
      <a href={user ? roleHome(user.role) : '/'}
        className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
        Back to home
      </a>
    </div>
  )
}
