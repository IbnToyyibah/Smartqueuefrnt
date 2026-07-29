import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose } from 'react-icons/md'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.() },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeOnBackdrop ? onClose : undefined}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${sizes[size] ?? sizes.md} bg-white rounded-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close modal"
                >
                  <MdClose size={20} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
