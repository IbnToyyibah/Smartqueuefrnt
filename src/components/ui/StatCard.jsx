import { motion } from 'framer-motion'

export default function StatCard({ icon, label, value, sub, color = 'indigo', trend, className = '' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
    teal: 'bg-teal-50 text-teal-600',
  }
  const iconCls = colors[color] ?? colors.indigo

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl p-5 border border-slate-100 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
              }`}
          >
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}
