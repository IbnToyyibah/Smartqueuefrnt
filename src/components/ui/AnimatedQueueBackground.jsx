import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const QUEUE_IMAGES = [
  '/Queue.jpg',
  '/Queue2.jpg',
  '/Queue3.jpg',
  '/Queue4.jpg',
  '/Queue5.jpg',
]

export default function AnimatedQueueBackground({ overlayOpacity = 'bg-slate-950/10', interval = 6000 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUEUE_IMAGES.length)
    }, interval)
    return () => clearInterval(timer)
  }, [interval])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <AnimatePresence mode="sync">
        <motion.div
          key={QUEUE_IMAGES[index]}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.8, ease: 'easeInOut' },
            scale: { duration: interval / 1000 + 1, ease: 'linear' },
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${QUEUE_IMAGES[index]})` }}
        />
      </AnimatePresence>

      {/* Dark overlay for readability */}
      {overlayOpacity && <div className={`absolute inset-0 ${overlayOpacity}`} />}
    </div>
  )
}
