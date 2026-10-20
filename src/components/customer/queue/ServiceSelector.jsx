import { MdAccessTime, MdCheckCircle } from 'react-icons/md'
import { SERVICE_ICONS } from '../../../lib/queueHelpers'

export default function ServiceSelector({ services, selectedServiceId, loading, error, onSelect }) {
    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>
    }

    if (!services.length) {
        return <p className="text-sm text-slate-500">No services available for this branch right now.</p>
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
                const id = service.id || service._id
                const isSelected = selectedServiceId === id
                const icon = SERVICE_ICONS[service.id] || SERVICE_ICONS[service.name?.toLowerCase()] || '📋'

                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-slate-300'}`}>
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{service.name || service.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <MdAccessTime size={11} />
                                ~{service.duration ?? 10} min
                            </p>
                        </div>
                        {isSelected && <MdCheckCircle size={18} className="text-violet-600 shrink-0" />}
                    </button>
                )
            })}
        </div>
    )
}
