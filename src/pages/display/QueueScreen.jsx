import { Link } from 'react-router-dom'

const CONFIG = {
  Queue1: { title: 'Queue 1', accent: 'from-violet-600 to-indigo-600' },
  Queue2: { title: 'Queue 2', accent: 'from-indigo-600 to-sky-600' },
  Queue3: { title: 'Queue 3', accent: 'from-emerald-600 to-teal-600' },
  Queue4: { title: 'Queue 4', accent: 'from-amber-500 to-orange-500' },
}

export default function QueueScreen() {
  const path = window.location.pathname
  const key = path === '/queue2' ? 'Queue2' : path === '/queue3' ? 'Queue3' : path === '/queue4' ? 'Queue4' : 'Queue1'
  const { title, accent } = CONFIG[key]

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 bg-gradient-to-br ${accent}`}>
      <div className="w-full max-w-4xl rounded-3xl bg-black/25 backdrop-blur-xl border border-white/10 p-8 sm:p-10 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3">SmartQueue Display</p>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">{title}</h1>
        <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-8">Live queue board coming soon.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['A001', 'A002', 'A003', 'A004'].map((t) => (
            <div key={t} className="rounded-2xl bg-white/10 border border-white/10 py-5">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Now Serving</p>
              <p className="text-2xl font-black mt-1">{t}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 font-semibold px-5 py-2.5">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
