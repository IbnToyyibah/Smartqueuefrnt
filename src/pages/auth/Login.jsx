import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdDashboard, MdArrowForward,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'

const ROLE_HOME = {
  customer: '/customer',
  staff: '/staff/dashboard',
  branch_admin: '/admin/branch',
  super_admin: '/admin/super',
}

export default function Login() {
  const { login, loading, error } = useAuth()
  const { notify } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || null

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    const res = await login(form.email, form.password)
    if (res.success) {
      notify('success', 'Welcome back!', `Signed in as ${res.user.name}`)
      navigate(from ?? ROLE_HOME[res.user.role] ?? '/')
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/60 to-indigo-50/40 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <MdDashboard size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-800">
              Smart<span className="text-violet-600">Queue</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-7">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <MdEmail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button type="button" className="text-xs text-violet-600 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <MdLock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password" name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit" size="lg" fullWidth loading={loading}
              className="bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
              iconRight={<MdArrowForward size={18} />}
            >
              Sign in
            </Button>
          </form>

          <p className="text-sm text-center text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  )
}
