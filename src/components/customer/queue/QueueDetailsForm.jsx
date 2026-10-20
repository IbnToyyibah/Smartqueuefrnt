import { MdPerson, MdPhone, MdEmail, MdNotifications } from 'react-icons/md'

const DETAILS_FIELDS = [
    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name', icon: MdPerson },
    { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+234 800 000 0000', icon: MdPhone },
    { id: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: MdEmail },
]

const NOTIFICATION_OPTIONS = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'both', label: 'Both' },
]

export default function QueueDetailsForm({ form, errors, onChange }) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Details</p>
                <p className="text-sm text-slate-500 mt-2">We use this to send queue updates and keep you notified.</p>
            </div>

            {DETAILS_FIELDS.map((field) => {
                const Icon = field.icon
                return (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="block text-xs font-semibold text-slate-700 mb-1.5">{field.label}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={15} /></span>
                            <input
                                id={field.id}
                                type={field.type}
                                value={form[field.id] || ''}
                                placeholder={field.placeholder}
                                onChange={(event) => onChange(field.id, event.target.value)}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors[field.id] ? 'border-red-300' : 'border-slate-200'}`}
                            />
                        </div>
                        {errors[field.id] && <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>}
                    </div>
                )
            })}

            <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1"><MdNotifications size={13} /> Notification preference</p>
                <div className="grid grid-cols-3 gap-2">
                    {NOTIFICATION_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange('notifyChannel', option.value)}
                            className={`py-2 rounded-xl border text-xs font-semibold transition-all ${form.notifyChannel === option.value ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
