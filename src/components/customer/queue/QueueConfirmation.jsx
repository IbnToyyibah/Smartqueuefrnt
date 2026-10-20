import { Link } from 'react-router-dom'
import { MdAccessTime, MdQrCode2 } from 'react-icons/md'
import QRCodeDisplay from '../../ui/QRCodeDisplay'

export default function QueueConfirmation({ ticket }) {
    if (!ticket) return null

    return (
        <div className="space-y-5">
            <div className="bg-violet-600 rounded-2xl p-5 text-white text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Queue Number</p>
                <p className="mt-3 text-5xl font-extrabold tracking-widest">{ticket.ticketNumber}</p>
                <p className="text-xs text-violet-200 mt-3">
                    Estimated wait – <span className="font-semibold text-white">{ticket.estimatedWait ?? 0} min</span>
                </p>
                <p className="text-xs text-violet-200 mt-1">
                    Position – <span className="font-semibold text-white">{ticket.position ?? '—'}</span>
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                    { label: 'Branch', value: ticket.branch?.name || 'Unknown' },
                    { label: 'Service', value: ticket.service?.label || ticket.service?.name || 'Unknown' },
                    { label: 'Est. wait', value: `${ticket.estimatedWait ?? 0} min` },
                    { label: 'Notify', value: (ticket.notifyChannel || 'both').toUpperCase() },
                ].map((entry) => (
                    <div key={entry.label} className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{entry.label}</p>
                        <p className="mt-2 font-semibold text-slate-800">{entry.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-sm">
                <div className="inline-flex items-center justify-center rounded-3xl bg-violet-50 p-4 mb-4">
                    <MdQrCode2 size={30} className="text-violet-500" />
                </div>
                <QRCodeDisplay value={ticket.qrCode || ticket.ticketNumber} size={160} />
                <p className="text-xs text-slate-500 mt-4">
                    Show this code at the branch entrance to check in and activate live tracking.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Link to={`/track?ticket=${encodeURIComponent(ticket.ticketNumber)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
                    <MdAccessTime size={18} /> Track Live
                </Link>
                <Link to="/join-queue" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300">
                    Join another queue
                </Link>
            </div>
        </div>
    )
}
