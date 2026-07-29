import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdNotifications,
  MdLogout,
  MdMenu,
  MdClose,
  MdDashboard,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import Badge from '../ui/Badge'

const roleLabel = {
  customer: 'Customer Self-Service',
  staff: 'Counter Terminal Agent',
  branch_admin: 'Branch Operations Admin',
  super_admin: 'Enterprise System Admin',
}

const roleHome = {
  customer: '/customer/track',
  staff: '/staff/dashboard',
  branch_admin: '/admin/branch',
  super_admin: '/admin/super',
}

export default function Navbar({ onMenuToggle, sidebarOpen }) {
  const { user, logout } = useAuth()
  const { unreadCount, inbox, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center px-2 sm:px-6 lg:px-8 gap-2 sticky top-0 z-30">
      {/* Mobile hamburger */}
      {user && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
        </button>
      )}

      {/* Brand Logo */}
      <Link
        to={user ? roleHome[user.role] ?? '/' : '/'}
        className="flex items-center gap-2.5 mr-2"
      >
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
          <MdDashboard size={18} className="text-white" />
        </div>
        <span className="font-extrabold text-white text-base tracking-tight leading-tight">
          Smart<span className="text-violet-400 font-black">Queue</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Notifications popover */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <MdNotifications size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-2xl border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Queue Notifications</p>
                      <button
                        onClick={markAllRead}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {inbox.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No active notifications</p>
                      ) : (
                        inbox.slice(0, 8).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.read && (
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                              <div className={!n.read ? '' : 'pl-4'}>
                                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {user.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-100 leading-tight">{user.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{roleLabel[user.role] ?? user.role}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                      <Badge variant={user.role} size="sm" className="mt-2">{roleLabel[user.role] ?? user.role}</Badge>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <MdLogout size={16} />
                        Sign Out Terminal
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
