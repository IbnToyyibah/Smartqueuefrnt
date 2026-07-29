import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MdSearch,
  MdFilterList,
  MdPeople,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdSwapHoriz,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useNotifications } from '../../context/NotificationContext'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

const STATUS_FILTERS = ['all', 'waiting', 'called', 'serving', 'served', 'noshow']

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'just now'
  if (diff === 1) return '1 min ago'
  return `${diff} min ago`
}

export default function StaffQueueList() {
  const { queue, counters, markNoShow, markServed, transferTicket } = useQueue()
  const { notify } = useNotifications()

  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [transferTicketId, setTransferTicketId] = useState(null)

  const filtered = queue.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.service?.label.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const transferTarget = transferTicketId
    ? queue.find((t) => t._id === transferTicketId)
    : null

  const handleNoShow = (id) => {
    const t = queue.find((q) => q._id === id)
    markNoShow(id)
    notify('warning', 'No-show recorded', `Ticket ${t?.ticketNumber} marked as no-show.`)
  }

  const handleServed = (id) => {
    const t = queue.find((q) => q._id === id)
    markServed(id, null)
    notify('success', 'Marked served', `Ticket ${t?.ticketNumber} completed.`)
  }

  const handleTransfer = (counterId) => {
    transferTicket(transferTicketId, counterId)
    const c = counters.find((c) => c._id === counterId)
    const t = transferTarget
    notify('info', 'Ticket transferred', `${t?.ticketNumber} → ${c?.name}`)
    setTransferTicketId(null)
  }

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? queue.length : queue.filter((t) => t.status === s).length
    return acc
  }, {})

  return (
    <AppLayout>
      <PageHeader
        title="Queue List"
        subtitle="Full view of all tickets across the branch"
        breadcrumb="Staff"
      />

      {/* status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 ${statusFilter === s ? 'text-indigo-200' : 'text-slate-400'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5">
        <div className="relative">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ticket number, or service…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* table header */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Ticket</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-2">Service</div>
        <div className="col-span-1">Wait</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* rows */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<MdPeople size={32} />}
          title="No tickets found"
          description="Try changing your filter or search term."
        />
      ) : (
        <AnimatePresence>
          <div className="flex flex-col gap-2">
            {filtered.map((t, i) => (
                <motion.div
                key={t._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                {/* position */}
                <div className="hidden sm:flex col-span-1 text-slate-400 font-mono text-xs">
                  {t.position}
                </div>

                {/* ticket no */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{t.ticketNumber}</span>
                </div>

                {/* name */}
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.name}</p>
                  <p className="text-xs text-slate-400 sm:hidden">{t.service?.label}</p>
                </div>

                {/* service */}
                <div className="hidden sm:block col-span-2">
                  <p className="text-xs text-slate-500 truncate">{t.service?.label}</p>
                </div>

                {/* wait */}
                <div className="hidden sm:flex col-span-1 items-center gap-1 text-xs text-slate-500">
                  <MdAccessTime size={13} />
                  {t.estimatedWait}m
                </div>

                {/* status */}
                <div className="col-span-1">
                  <Badge variant={t.status} size="sm">
                    {t.status}
                  </Badge>
                </div>

                {/* actions */}
                <div className="col-span-2 flex gap-2 justify-end flex-wrap">
                  {t.status === 'waiting' && (
                    <>
                      <button
                        onClick={() => setTransferTicketId(t._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Transfer"
                        aria-label="Transfer ticket"
                      >
                        <MdSwapHoriz size={18} />
                      </button>
                      <button
                        onClick={() => handleNoShow(t._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Mark no-show"
                        aria-label="Mark as no-show"
                      >
                        <MdCancel size={18} />
                      </button>
                    </>
                  )}
                  {(t.status === 'called' || t.status === 'serving') && (
                    <button
                      onClick={() => handleServed(t._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Mark served"
                      aria-label="Mark as served"
                    >
                      <MdCheckCircle size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Transfer modal */}
      <Modal
        open={!!transferTicketId}
        onClose={() => setTransferTicketId(null)}
        title={`Transfer ${transferTarget?.ticketNumber ?? ''}`}
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-4">
          Reassign <strong>{transferTarget?.name}</strong> to another active counter.
        </p>
        <div className="flex flex-col gap-2">
          {counters
            .filter((c) => c.status === 'active')
            .map((c) => (
              <button
                key={c._id}
                onClick={() => handleTransfer(c._id)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm"
              >
                <span className="font-semibold text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-400">{c.agent?.name || 'Unassigned'}</span>
              </button>
            ))}
        </div>
      </Modal>
    </AppLayout>
  )
}
