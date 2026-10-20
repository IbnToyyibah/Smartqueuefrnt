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
const QueueScreen = lazy(() => import('./pages/display/QueueScreen'))

/* ── Authenticated customer ── */
const LiveTracking = lazy(() => import('./pages/customer/LiveTracking'))
const QueueRegistration = lazy(() => import('./pages/customer/QueueRegistration'))
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

const customerRoutes = [
  { path: '/customer/track', element: <LiveTracking />, roles: ['customer'] },
  { path: '/customer/register', element: <QueueRegistration />, roles: ['customer'] },
  { path: '/customer/history', element: <QueueHistory />, roles: ['customer'] },
]

const staffRoutes = [
  { path: '/staff/dashboard', element: <StaffDashboard />, roles: ['staff'] },
  { path: '/staff/queue', element: <StaffQueueList />, roles: ['staff'] },
  { path: '/staff/history', element: <QueueHistory />, roles: ['staff'] },
]

const branchAdminRoutes = [
  { path: '/admin/branch', element: <BranchOverview />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/queues', element: <AdminQueueList />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/counters', element: <Counters />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/staff', element: <StaffManagement />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/services', element: <Services />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/analytics', element: <Analytics />, roles: ['branch_admin', 'super_admin'] },
  { path: '/admin/reports', element: <Reports />, roles: ['branch_admin', 'super_admin'] },
]

const superAdminRoutes = [
  { path: '/admin/super', element: <SuperAdminDashboard />, roles: ['super_admin'] },
  { path: '/admin/branches', element: <AllBranches />, roles: ['super_admin'] },
  { path: '/admin/users', element: <UserManagement />, roles: ['super_admin'] },
  { path: '/admin/permissions', element: <Permissions />, roles: ['super_admin'] },
  { path: '/admin/audit', element: <AuditLogs />, roles: ['super_admin'] },
  { path: '/admin/system', element: <SystemSettings />, roles: ['super_admin'] },
]

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

function ProtectedRoute({ roles, element }) {
  return (
    <RequireAuth>
      <RequireRole roles={roles}>{element}</RequireRole>
    </RequireAuth>
  )
}

function roleHome(role) {
  return {
    customer: '/customer',
    staff: '/staff/dashboard',
    branch_admin: '/admin/branch',
    super_admin: '/admin/super',
  }[role] ?? '/'
}

function SettingsRouter() {
  const { user } = useAuth()
  if (user?.role === 'super_admin') return <SystemSettings />
  if (user?.role === 'branch_admin') return <BranchSettings />
  return <Navigate to={roleHome(user?.role ?? '')} replace />
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/join-queue" element={<PublicJoinQueue />} />
        <Route path="/track" element={<PublicTrack />} />
        <Route path="/find-branch" element={<FindBranch />} />
        <Route path="/queue" element={<QueueScreen />} />
        <Route path="/queue2" element={<QueueScreen />} />
        <Route path="/queue3" element={<QueueScreen />} />
        <Route path="/queue4" element={<QueueScreen />} />
        <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
        {customerRoutes.map(({ path, element, roles }) => (
          <Route key={path} path={path} element={<ProtectedRoute roles={roles} element={element} />} />
        ))}
        {staffRoutes.map(({ path, element, roles }) => (
          <Route key={path} path={path} element={<ProtectedRoute roles={roles} element={element} />} />
        ))}
        {branchAdminRoutes.map(({ path, element, roles }) => (
          <Route key={path} path={path} element={<ProtectedRoute roles={roles} element={element} />} />
        ))}
        <Route path="/admin/settings" element={<RequireAuth><SettingsRouter /></RequireAuth>} />
        {superAdminRoutes.map(({ path, element, roles }) => (
          <Route key={path} path={path} element={<ProtectedRoute roles={roles} element={element} />} />
        ))}
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
