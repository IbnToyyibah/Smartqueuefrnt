/**
 * PageHeader — consistent heading block for dashboard pages.
 */
export default function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        {breadcrumb && (
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">{breadcrumb}</p>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
