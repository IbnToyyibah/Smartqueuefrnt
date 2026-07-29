import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdQrCode2, MdTrackChanges, MdLocationOn, MdDashboard, MdArrowForward,
} from 'react-icons/md'
import PublicLayout from '../../components/layout/PublicLayout'

const TILES = [
  {
    to: '/join-queue',
    icon: <MdQrCode2 size={30} />,
    label: 'Join Queue',
    desc: 'Register virtually. No account needed.',
    bg: 'bg-violet-600',
    hover: 'hover:border-violet-400',
    text: 'text-violet-600',
  },
  {
    to: '/track',
    icon: <MdTrackChanges size={30} />,
    label: 'Track Queue',
    desc: 'See your live position and estimated wait.',
    bg: 'bg-indigo-600',
    hover: 'hover:border-indigo-400',
    text: 'text-indigo-600',
  },
  {
    to: '/find-branch',
    icon: <MdLocationOn size={30} />,
    label: 'Find Branch',
    desc: 'Locate a branch near you.',
    bg: 'bg-emerald-600',
    hover: 'hover:border-emerald-400',
    text: 'text-emerald-600',
  },
]

const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut', delay: d },
})

export default function CustomerHome() {
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40 flex flex-col items-center justify-center px-4 py-12">

        {/* Welcome block */}
        <motion.div {...fadeUp(0)} className="text-center mb-10 max-w-md">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <MdDashboard size={28} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Welcome to <span className="text-violet-600">SmartQueue</span>
          </h1>
          <p className="mt-3 text-slate-500 text-base leading-relaxed">
            Skip the physical line. Join, track, and get notified — no account needed.
          </p>
        </motion.div>

        {/* 3 action tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {TILES.map((tile, i) => (
            <motion.div key={tile.to} {...fadeUp(0.1 + i * 0.08)}>
              <Link to={tile.to}
                className={`group flex flex-col items-start gap-4 bg-white border-2 border-slate-100 ${tile.hover} rounded-2xl p-6 transition-all h-full`}>
                <div className={`w-12 h-12 ${tile.bg} rounded-xl flex items-center justify-center text-white`}>
                  {tile.icon}
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-slate-800 text-base mb-1">{tile.label}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{tile.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${tile.text}`}>
                  Get started <MdArrowForward size={13} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Staff sign-in */}
        <motion.p {...fadeUp(0.45)} className="mt-10 text-sm text-slate-400">
          Staff or admin?{' '}
          <Link to="/login" className="text-violet-600 font-semibold hover:underline">Sign in here</Link>
        </motion.p>

        {/* Live indicator */}
        <motion.div {...fadeUp(0.5)} className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Queue system is live and operational
        </motion.div>
      </div>
    </PublicLayout>
  )
}
