import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MdRefresh, MdVolumeUp } from 'react-icons/md'
import { branchApi, queueApi } from '../../lib/api'
import { connectSocket, joinBranch, leaveBranch } from '../../lib/socket'

const REFRESH_MS = 20000

export default function QueueScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const branchId = searchParams.get('branch') || ''
  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(Boolean(branchId))
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    branchApi.list().then(({ branches: items }) => setBranches(items || []))
      .catch(() => setError('Unable to load branches. Please refresh the display.'))
  }, [])

  const refresh = useCallback(async () => {
    if (!branchId) return
    try {
      const data = await queueApi.display(branchId)
      setBranch(data.branch)
      setTickets(data.tickets || [])
      setUpdatedAt(data.updated_at ? new Date(data.updated_at) : new Date())
      setError('')
    } catch (err) {
      setError(err.message || 'Queue information is temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    if (!branchId) {
      return undefined
    }

    const initialRefresh = window.setTimeout(refresh, 0)
    const interval = window.setInterval(refresh, REFRESH_MS)
    const socket = connectSocket(localStorage.getItem('sq_token') || '')
    const subscribe = () => joinBranch(branchId)
    socket.on('connect', subscribe)
    if (socket.connected) subscribe()
    const onUpdate = () => refresh()
    socket.on('queue:updated', onUpdate)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(initialRefresh)
      socket.off('connect', subscribe)
      socket.off('queue:updated', onUpdate)
      leaveBranch(branchId)
    }
  }, [branchId, refresh])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const serving = useMemo(() => tickets.filter((ticket) => ['called', 'serving'].includes(ticket.status)), [tickets])
  const waiting = useMemo(() => tickets.filter((ticket) => ticket.status === 'waiting').sort((a, b) => (a.position || 0) - (b.position || 0)), [tickets])
  const setBranchId = (id) => {
    setLoading(Boolean(id))
    setSearchParams(id ? { branch: id } : {})
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">SmartQueue · Live display</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{branch?.name || 'Queue display'}</h1>
            {branch?.city && <p className="mt-1 text-sm text-slate-400">{branch.city}</p>}
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-400">{clock.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <span className="hidden h-10 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-2 text-xs text-emerald-300 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> LIVE</div>
          </div>
        </header>

        {!branchId ? (
          <section className="mx-auto mt-24 max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold">Choose a branch</h2>
            <p className="mt-2 text-sm text-slate-400">Select which queue this screen should display.</p>
            <select value="" onChange={(event) => setBranchId(event.target.value)} className="mt-6 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400">
              <option value="" disabled>{branches.length ? 'Select a branch' : 'Loading branches…'}</option>
              {branches.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}{item.city ? ` · ${item.city}` : ''}</option>)}
            </select>
          </section>
        ) : (
          <>
            <div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Now serving</p><h2 className="mt-1 text-2xl font-bold">Please proceed to your counter</h2></div>
                  <MdVolumeUp className="text-cyan-300" size={25} aria-hidden="true" />
                </div>
                {loading && !tickets.length ? <p className="py-10 text-center text-slate-400">Loading live queue…</p> : serving.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {serving.map((ticket) => <article key={ticket.id} className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/10 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{ticket.status === 'called' ? 'Ticket called' : 'Being served'}</p>
                      <p className="mt-2 font-mono text-5xl font-black tracking-tight sm:text-6xl">{ticket.ticket_number}</p>
                      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-sm"><span className="text-slate-300">{ticket.service}</span><span className="font-semibold text-white">{ticket.counter || 'Please ask staff'}</span></div>
                    </article>)}
                  </div>
                ) : <div className="rounded-2xl border border-dashed border-white/15 px-5 py-14 text-center"><p className="text-lg font-semibold">No tickets are being served</p><p className="mt-1 text-sm text-slate-400">We’ll show the next call here.</p></div>}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
                <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">Waiting</p><h2 className="mt-1 text-2xl font-bold">Up next</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{waiting.length} tickets</span></div>
                {waiting.length ? <div className="mt-5 divide-y divide-white/10">
                  {waiting.slice(0, 8).map((ticket) => <div key={ticket.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-mono text-xl font-bold">{ticket.ticket_number}</p><p className="text-xs text-slate-400">{ticket.service}</p></div><span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">{ticket.position ? `#${ticket.position} in line` : 'Waiting'}</span></div>)}
                  {waiting.length > 8 && <p className="pt-3 text-center text-xs text-slate-500">And {waiting.length - 8} more in line</p>}
                </div> : <p className="py-12 text-center text-sm text-slate-400">The queue is clear.</p>}
              </section>
            </div>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <p>{error ? <span className="text-amber-300">{error} · Retrying automatically.</span> : <>Updated {updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'} · Refreshes automatically</>}</p>
              <div className="flex items-center gap-4"><button onClick={refresh} className="inline-flex items-center gap-1.5 transition hover:text-white"><MdRefresh size={15} /> Refresh</button><button onClick={() => setBranchId('')} className="hover:text-white">Change branch</button></div>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}
