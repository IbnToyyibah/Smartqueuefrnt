import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdQrCode2, MdTrackChanges, MdDashboard, MdPeople, MdBarChart,
  MdSettings, MdBusiness, MdHistory, MdClose, MdLocationOn,
  MdDesktopWindows, MdMedicalServices, MdAssessment, MdSecurity,
  MdBadge, MdLogout,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'

const NAV_MAP = {
  customer: [
    { to: '/customer', icon: <MdDashboard size={18} />, label: 'Home' },
    { to: '/join-queue', icon: <MdQrCode2 size={18} />, label: 'Join Queue' },
    { to: '/track', icon: <MdTrackChanges size={18} />, label: 'Track Queue' },
    { to: '/find-branch', icon: <MdLocationOn size={18} />, label: 'Find Branch' },
    { to: '/customer/history', icon: <MdHistory size={18} />, label: 'History' },
  ],
  staff: [
    { to: '/staff/dashboard', icon: <MdDashboard size={18} />, label: 'Dashboard' },
    { to: '/staff/queue', icon: <MdPeople size={18} />, label: 'Current Queue' },
    { to: '/staff/history', icon: <MdHistory size={18} />, label: 'History' },
  ],
  branch_admin: [
    { to: '/admin/branch', icon: <MdDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/queues', icon: <MdPeople size={18} />, label: 'Queues' },
    { to: '/admin/counters', icon: <MdDesktopWindows size={18} />, label: 'Counters' },
    { to: '/admin/staff', icon: <MdBadge size={18} />, label: 'Staff' },
    { to: '/admin/services', icon: <MdMedicalServices size={18} />, label: 'Services' },
    { to: '/admin/analytics', icon: <MdBarChart size={18} />, label: 'Analytics' },
    { to: '/admin/reports', icon: <MdAssessment size={18} />, label: 'Reports' },
    { to: '/admin/settings', icon: <MdSettings size={18} />, label: 'Settings' },
  ],
  super_admin: [
    { to: '/admin/super', icon: <MdDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/branches', icon: <MdBusiness size={18} />, label: 'Branches' },
    { to: '/admin/users', icon: <MdPeople size={18} />, label: 'Users' },
    { to: '/admin/permissions', icon: <MdSecurity size={18} />, label: 'Permissions' },
    { to: '/admin/analytics', icon: <MdBarChart size={18} />, label: 'Analytics' },
    { to: '/admin/settings', icon: <MdSettings size={18} />, label: 'System Settings' },
    { to: '/admin/audit', icon: <MdHistory size={18} />, label: 'Audit Logs' },
  ],
}

function Brand({ showClose, onClose }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-4 bg-white border-b border-slate-100">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
          <MdDashboard size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
          Smart<span className="text-violet-600 font-black">Queue</span>
        </span>
      </div>
      {showClose && (
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close menu">
          <MdClose size={20} />
        </button>
      )}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const links = NAV_MAP[user.role] ?? []

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
      ? 'bg-violet-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/')
  }

  const content = (showClose = false) => (
    <div className="flex flex-col h-full min-h-0">
      <Brand showClose={showClose} onClose={onClose} />
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={linkCls} onClick={onClose}>
            <span className="shrink-0">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-3 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <MdLogout size={18} className="shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 z-20 flex-col w-56 bg-white border-r border-slate-100">
        {content(false)}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-full w-60 bg-white lg:hidden flex flex-col"
            >
              {content(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
