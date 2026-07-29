import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdBusiness, MdAccessTime, MdCheckCircle,
  MdArrowForward, MdArrowBack, MdPhone, MdEmail,
  MdNotifications, MdQrCode2, MdLocationOn, MdPerson,
} from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { branchApi } from '../../lib/api'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

const SERVICE_ICONS = {
  general: '💬', account: '🏦', loans: '💳',
  consultation: '🩺', document: '📄', complaints: '📢',
}
const TIME_SLOTS = [
  'As soon as possible', '9:00 AM – 10:00 AM', '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM', '1:00 PM – 2:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM',
]
const STEPS = ['Branch', 'Service', 'Details', 'Confirm']

function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i <= current ? 'bg-violet-600' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

export default function QueueRegistration() {
  const { joinQueue, SERVICE_TYPES } = useQueue()
  const { user } = useAuth()
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [branches, setBranches] = useState([])
  const [loadingB, setLoadingB] = useState(true)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    branchId: '', serviceId: '', timeSlot: TIME_SLOTS[0],
    name: user?.name || '', email: user?.email || '',
    phone: user?.phone || '', notifyChannel: user?.notifyChannel || 'both',
  })

  useEffect(() => {
    branchApi.list()
      .then(({ branches: b }) => setBranches(b))
      .catch(() => notify('error', 'Failed to load branches', 'Please refresh.'))
      .finally(() => setLoadingB(false))
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const errs = {}
    if (step === 0 && !form.branchId) errs.branchId = 'Please select a branch.'
    if (step === 1 && !form.serviceId) errs.serviceId = 'Please select a service.'
    if (step === 2) {
      if (!form.name.trim()) errs.name = 'Name is required.'
      if (!form.email.trim()) errs.email = 'Email is required.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const ticket = await joinQueue(form)
      notify('success', 'Ticket confirmed!', `Your ticket is ${ticket.ticketNumber}. Est. wait: ${ticket.estimatedWait} min.`)
      navigate('/customer/track')
    } catch (err) {
      notify('error', 'Failed to join queue', err.message || 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBranch = branches.find(b => b._id === form.branchId)
  const selectedService = SERVICE_TYPES.find(s => s.id === form.serviceId)
    || (selectedBranch?.services || []).find(s => s.id === form.serviceId)

  return (
    <AppLayout>
      <PageHeader title="Join a Queue" subtitle="Register remotely — arrive when it's almost your turn." breadcrumb="Customer" />
      <div className="max-w-xl mx-auto">
        <ProgressBar current={step} total={STEPS.length} />
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
          <p className="text-sm font-semibold text-violet-600">{STEPS[step]}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
          <AnimatePresence mode="wait">

            {/* Step 0 — Branch */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Select branch</h3>
                <p className="text-sm text-slate-500 mb-5">Choose the location you will visit.</p>
                {loadingB ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {branches.map(b => (
                      <button key={b._id} type="button" onClick={() => set('branchId', b._id)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${form.branchId === b._id ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.branchId === b._id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <MdBusiness size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MdLocationOn size={11} />{b.address || b.city}</p>
                        </div>
                        {form.branchId === b._id && <MdCheckCircle size={20} className="text-violet-600 shrink-0 mt-0.5" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.branchId && <p className="text-xs text-red-500 mt-2">{errors.branchId}</p>}
              </motion.div>
            )}

            {/* Step 1 — Service */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Select service</h3>
                <p className="text-sm text-slate-500 mb-5">What do you need help with today?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedBranch?.services?.filter(s => s.active) || SERVICE_TYPES).map(s => (
                    <button key={s.id || s._id} type="button" onClick={() => set('serviceId', s.id || s._id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${form.serviceId === (s.id || s._id) ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                      <span className="text-2xl">{SERVICE_ICONS[s.id] ?? '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{s.name || s.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MdAccessTime size={11} />~{s.duration} min</p>
                      </div>
                      {form.serviceId === (s.id || s._id) && <MdCheckCircle size={18} className="text-violet-600 shrink-0" />}
                    </button>
                  ))}
                </div>
                {errors.serviceId && <p className="text-xs text-red-500 mt-2">{errors.serviceId}</p>}
                <div className="mt-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred time slot</label>
                  <select value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Contact */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
                className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Your details</h3>
                  <p className="text-sm text-slate-500 mb-4">We'll use these to send you queue updates.</p>
                </div>
                {[
                  { id: 'name', label: 'Full name', icon: <MdPerson size={15} />, type: 'text', ph: 'Your full name' },
                  { id: 'email', label: 'Email address', icon: <MdEmail size={15} />, type: 'email', ph: 'you@example.com' },
                  { id: 'phone', label: 'Phone (for SMS)', icon: <MdPhone size={15} />, type: 'tel', ph: '+234 800 000 0000' },
                ].map(f => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{f.icon}</span>
                      <input id={f.id} type={f.type} value={form[f.id]} placeholder={f.ph}
                        onChange={e => set(f.id, e.target.value)}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors[f.id] ? 'border-red-300' : 'border-slate-200'}`} />
                    </div>
                    {errors[f.id] && <p className="text-xs text-red-500 mt-1">{errors[f.id]}</p>}
                  </div>
                ))}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1"><MdNotifications size={13} />Notification preference</p>
                  <div className="flex gap-2">
                    {[{ v: 'email', l: 'Email' }, { v: 'sms', l: 'SMS' }, { v: 'both', l: 'Both' }].map(ch => (
                      <button key={ch.v} type="button" onClick={() => set('notifyChannel', ch.v)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${form.notifyChannel === ch.v ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                        {ch.l}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Confirm registration</h3>
                <p className="text-sm text-slate-500 mb-5">Review your details before joining the queue.</p>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-4">
                  {[
                    { label: 'Branch', value: selectedBranch?.name },
                    { label: 'Service', value: selectedService?.name || selectedService?.label },
                    { label: 'Time slot', value: form.timeSlot },
                    { label: 'Name', value: form.name },
                    { label: 'Email', value: form.email },
                    { label: 'Phone', value: form.phone || '—' },
                    { label: 'Notify via', value: form.notifyChannel.toUpperCase() },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 font-medium">{r.label}</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[55%] truncate">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                    <MdAccessTime size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-violet-600 font-semibold">Estimated wait time</p>
                    <p className="text-2xl font-extrabold text-slate-800">~{(selectedService?.duration ?? 10) * 3} min</p>
                  </div>
                  <div className="ml-auto"><MdQrCode2 size={30} className="text-violet-300" /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <Button type="button" variant="secondary" size="lg" onClick={back} icon={<MdArrowBack size={18} />}>Back</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" size="lg" fullWidth onClick={next}
                className="bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
                iconRight={<MdArrowForward size={18} />}>Continue</Button>
            ) : (
              <Button type="button" size="lg" fullWidth loading={submitting}
                className="bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
                icon={<MdQrCode2 size={18} />} onClick={handleSubmit}>
                Join Queue & Get Ticket
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
