const variants = {
  waiting:    'bg-amber-100 text-amber-700 border border-amber-200',
  called:     'bg-blue-100 text-blue-700 border border-blue-200',
  serving:    'bg-indigo-100 text-indigo-700 border border-indigo-200',
  served:     'bg-green-100 text-green-700 border border-green-200',
  noshow:     'bg-red-100 text-red-600 border border-red-200',
  active:     'bg-green-100 text-green-700 border border-green-200',
  paused:     'bg-amber-100 text-amber-700 border border-amber-200',
  closed:     'bg-slate-100 text-slate-500 border border-slate-200',
  info:       'bg-blue-100 text-blue-700 border border-blue-200',
  success:    'bg-green-100 text-green-700 border border-green-200',
  warning:    'bg-amber-100 text-amber-700 border border-amber-200',
  error:      'bg-red-100 text-red-600 border border-red-200',
  customer:   'bg-sky-100 text-sky-700 border border-sky-200',
  staff:      'bg-violet-100 text-violet-700 border border-violet-200',
  branch_admin: 'bg-orange-100 text-orange-700 border border-orange-200',
  super_admin:  'bg-rose-100 text-rose-700 border border-rose-200',
  blue:   'bg-blue-100 text-blue-700 border border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border border-orange-200',
  green:  'bg-green-100 text-green-700 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  red:    'bg-red-100 text-red-600 border border-red-200',
}

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
}

export default function Badge({ variant = 'info', size = 'md', children, className = '' }) {
  const cls = variants[variant] ?? variants.info
  const sz  = sizes[size] ?? sizes.md
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${cls} ${sz} ${className}`}>
      {children}
    </span>
  )
}
