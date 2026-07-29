import { AnimatePresence, motion } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext'
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfo,
  MdClose,
} from 'react-icons/md'

const icons = {
  success: <MdCheckCircle size={20} className="text-emerald-500 shrink-0" />,
  error:   <MdError       size={20} className="text-red-500 shrink-0" />,
  warning: <MdWarning     size={20} className="text-amber-500 shrink-0" />,
  info:    <MdInfo        size={20} className="text-blue-500 shrink-0" />,
}

const borders = {
  success: 'border-l-4 border-emerald-400',
  error:   'border-l-4 border-red-400',
  warning: 'border-l-4 border-amber-400',
  info:    'border-l-4 border-blue-400',
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications()

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-80 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto bg-white rounded-xl p-4 flex gap-3 items-start ${borders[toast.type] ?? borders.info}`}
            role="alert"
          >
            {icons[toast.type] ?? icons.info}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-semibold text-slate-800 truncate">{toast.title}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 mt-0.5"
              aria-label="Dismiss notification"
            >
              <MdClose size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
