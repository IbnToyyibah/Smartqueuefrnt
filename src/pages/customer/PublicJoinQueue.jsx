import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdBusiness, MdAccessTime, MdCheckCircle, MdArrowForward,
  MdArrowBack, MdPerson, MdPhone, MdEmail, MdNotifications,
  MdQrCode2, MdLocationOn,
} from 'react-icons/md'
import { branchApi, queueApi } from '../../lib/api'
import { useNotifications } from '../../context/NotificationContext'
import PublicLayout from '../../components/layout/PublicLayout'
import QRCodeDisplay from '../../components/ui/QRCodeDisplay'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const SERVICE_ICONS = {
  general: '💬',
  account: '🏦',
  loans: '💳',
  consultation: '🩺',
  buying: '🛒',
  pharmacy: '💊',
  xray: '🩻',
  laboratory: '🔬',
  emergency: '🚨',
  payments: '💰',
  payment: '💰',
  registration: '📝',
  document: '📄',
  complaints: '📢',
  complaint: '📢',
  biscuits: '🍪',
  sweet: '🍬',
  chocolate: '🍫',
  inquiry: '❓',
  verification: '✅',
}
const TIME_SLOTS = [
  'As soon as possible', '9:00 AM – 10:00 AM', '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM', '1:00 PM – 2:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM',
]
const STEPS = ['Branch', 'Service', 'Details', 'Your Ticket']

function getBranchSubscriptionStatus(branch) {
  if (!branch) return 'expired'
  const now = new Date()
  if (branch.subscriptionStatus === 'trial' && branch.trialEndDate && now > new Date(branch.trialEndDate)) {
    return 'expired'
  }
  if (branch.subscriptionStatus === 'active' && branch.subscriptionEndDate && now > new Date(branch.subscriptionEndDate)) {
    return 'expired'
  }
  return branch.subscriptionStatus || 'active'
}

function canJoinBranch(branch) {
  const status = getBranchSubscriptionStatus(branch)
  return status === 'active' || status === 'trial'
}

function ProgressBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${i < current ? 'bg-violet-600 text-white' :
              i === current ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400' :
                'bg-slate-100 text-slate-400'
              }`}>
              {i < current ? <MdCheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-violet-700' : i < current ? 'text-slate-600' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < current ? 'bg-violet-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PublicJoinQueue() {
  const { notify } = useNotifications()
  const [searchParams] = useSearchParams()

  const [branches, setBranches] = useState([])
  const [loadingB, setLoadingB] = useState(true)
  const [loadingServices, setLoadingServices] = useState(false)
  const [services, setServices] = useState([])
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    branchId: searchParams.get('branch') || '',
    serviceId: '', timeSlot: TIME_SLOTS[0],
    name: '', email: '', phone: '', notifyChannel: 'both',
  })

  useEffect(() => {
    branchApi.list()
      .then(({ branches: b }) => {
        setBranches(b)
        // If branch was pre-selected via URL param and it's valid, skip to step 1
        const preSelected = searchParams.get('branch')
        if (preSelected && b.find(br => br._id === preSelected)) {
          setStep(1)
        }
      })
      .catch(() => notify('error', 'Could not load branches', 'Please refresh.'))
      .finally(() => setLoadingB(false))
  }, [])

  useEffect(() => {
    if (!form.branchId) {
      setServices([])
      return
    }

    let alive = true
    setLoadingServices(true)
    setServices([])
    setForm((f) => ({ ...f, serviceId: '' }))

    branchApi.getServices(form.branchId)
      .then(({ services: list }) => {
        if (!alive) return
        setServices(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!alive) return
        notify('error', 'Could not load services', 'Please select another branch or refresh.')
      })
      .finally(() => {
        if (alive) setLoadingServices(false)
      })

    return () => {
      alive = false
    }
  }, [form.branchId, notify])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const selectedBranch = branches.find(b => b._id === form.branchId)
  const availableServices = services

  /** Check if the selected branch has an expired/suspended subscription */
  const branchExpired = selectedBranch && !canJoinBranch(selectedBranch)

  const validate = () => {
    const errs = {}
    if (step === 0 && !form.branchId) errs.branchId = 'Please select a branch.'
    if (step === 0 && branchExpired) errs.branchId = "This branch's subscription has expired. Please select another branch."
    if (step === 1 && !form.serviceId) errs.serviceId = 'Please select a service.'
    if (step === 2) {
      if (!form.name.trim()) errs.name = 'Your name is required.'
      if (!form.email.trim() && !form.phone.trim())
        errs.contact = 'Provide at least an email or phone number.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const { ticket: t } = await queueApi.join(form)
      setTicket(t)
      setStep(3)
    } catch (err) {
      notify('error', 'Failed to join queue', err.message || 'Please try again.')
    } finally { setSubmitting(false) }
  }

  const activeServices = availableServices.filter((s) => s.active !== false)

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/60 to-indigo-50/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900">
              {step < 3 ? 'Join a Queue' : '🎫 Your Ticket'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === 0 && 'No account needed. Select your branch.'}
              {step === 1 && 'Choose the service you need.'}
              {step === 2 && 'Enter your details to receive updates.'}
              {step === 3 && 'Show this at the venue or track online.'}
            </p>
          </motion.div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
            <ProgressBar current={step} />

            <AnimatePresence mode="wait">

              {/* ── Step 0: Branch ── */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Branch</p>
                  {loadingB ? (
                    <div className="flex justify-center py-8">
                      <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {branches.map(b => {
                        const status = getBranchSubscriptionStatus(b)
                        const isExpired = !canJoinBranch(b)
                        return (
                          <button key={b._id} type="button" onClick={() => { set('branchId', b._id); set('serviceId', '') }}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${form.branchId === b._id
                              ? (isExpired ? 'border-red-400 bg-red-50' : 'border-violet-500 bg-violet-50')
                              : (isExpired ? 'border-red-200 bg-red-50/40 opacity-70' : 'border-slate-200 hover:border-violet-300')
                              }`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${form.branchId === b._id ? (isExpired ? 'bg-red-400 text-white' : 'bg-violet-600 text-white') : 'bg-slate-100 text-slate-500'}`}>
                              <MdBusiness size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-800 text-sm truncate">{b.name}</p>
                                {isExpired && (
                                  <span className="text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full border border-red-200 shrink-0">
                                    {status === 'suspended' ? 'Suspended' : 'Expired'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <MdLocationOn size={10} />{b.city}{b.address ? ` — ${b.address}` : ''}
                              </p>
                            </div>
                            {form.branchId === b._id && !isExpired && <MdCheckCircle size={18} className="text-violet-600 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {branchExpired && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs text-red-600 font-semibold">
                        This branch&apos;s subscription has expired. Please select another branch.
                      </p>
                    </div>
                  )}
                  {errors.branchId && !branchExpired && <p className="text-xs text-red-500 mt-2">{errors.branchId}</p>}
                </motion.div>
              )}

              {/* ── Step 1: Service ── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {selectedBranch?.name} — Choose Service
                  </p>
                  {loadingServices ? (
                    <div className="flex justify-center py-8">
                      <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activeServices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No services available for this branch yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mb-5">
                      {activeServices.map(s => (
                        <button key={s.id} type="button" onClick={() => set('serviceId', s.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${form.serviceId === s.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300'
                            }`}>
                          <span className="text-xl shrink-0">{SERVICE_ICONS[s.id] ?? '📋'}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-0.5">
                              <MdAccessTime size={10} /> ~{s.duration} min
                            </p>
                          </div>
                          {form.serviceId === s.id && <MdCheckCircle size={18} className="text-violet-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.serviceId && <p className="text-xs text-red-500 mb-3">{errors.serviceId}</p>}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Time</p>
                    <select value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Details ── */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Details</p>
                  {[
                    { k: 'name', label: 'Full Name *', icon: <MdPerson size={15} />, type: 'text', ph: 'Your full name' },
                    { k: 'phone', label: 'Phone Number', icon: <MdPhone size={15} />, type: 'tel', ph: '+234 800 000 0000' },
                    { k: 'email', label: 'Email (optional)', icon: <MdEmail size={15} />, type: 'email', ph: 'you@example.com' },
                  ].map(f => (
                    <div key={f.k}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{f.icon}</span>
                        <input type={f.type} value={form[f.k]} placeholder={f.ph}
                          onChange={e => set(f.k, e.target.value)}
                          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors[f.k] ? 'border-red-300' : 'border-slate-200'}`} />
                      </div>
                      {errors[f.k] && <p className="text-xs text-red-500 mt-1">{errors[f.k]}</p>}
                    </div>
                  ))}
                  {errors.contact && <p className="text-xs text-red-500">{errors.contact}</p>}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1"><MdNotifications size={13} /> Notify me via</p>
                    <div className="flex gap-2">
                      {[{ v: 'sms', l: 'SMS' }, { v: 'email', l: 'Email' }, { v: 'both', l: 'Both' }].map(ch => (
                        <button key={ch.v} type="button" onClick={() => set('notifyChannel', ch.v)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${form.notifyChannel === ch.v ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                          {ch.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Ticket ── */}
              {step === 3 && ticket && (
                <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-5">
                  <div className="w-full bg-violet-600 rounded-2xl p-5 text-white text-center">
                    <p className="text-xs font-semibold text-violet-200 mb-1">Queue Number</p>
                    <p className="text-5xl font-extrabold tracking-widest">{ticket.ticketNumber}</p>
                    <p className="text-xs text-violet-200 mt-2">
                      Estimated Wait — <span className="font-bold text-white">{ticket.estimatedWait ?? 0} Minutes</span>
                    </p>
                    <p className="text-xs text-violet-200 mt-1">
                      Position — <span className="font-bold text-white">{ticket.position}</span>
                    </p>
                  </div>

                  <QRCodeDisplay value={ticket.qrCode || ticket.ticketNumber} ticketNumber={ticket.ticketNumber} size={160} />

                  <div className="grid grid-cols-2 gap-3 w-full text-sm">
                    {[
                      { label: 'Branch', value: ticket.branch?.name },
                      { label: 'Service', value: ticket.service?.label || ticket.service?.name },
                      { label: 'Est. wait', value: `${ticket.estimatedWait ?? 0} min` },
                      { label: 'Notify', value: (ticket.notifyChannel || 'both').toUpperCase() },
                    ].map(r => (
                      <div key={r.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400">{r.label}</p>
                        <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{r.value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    Show the QR code at the entrance to check in and activate live tracking.
                  </p>

                  <div className="flex gap-3 w-full">
                    <Link to={`/track?ticket=${ticket.ticketNumber}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors">
                      <MdArrowForward size={16} /> Track Live
                    </Link>
                    <Link to="/join-queue"
                      className="flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:border-violet-400 text-sm font-semibold transition-colors">
                      New
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 3 && (
              <div className="flex items-center gap-3 mt-7">
                {step > 0 && (
                  <Button type="button" variant="secondary" size="lg" onClick={back} icon={<MdArrowBack size={16} />}>Back</Button>
                )}
                {step < 2 ? (
                  <Button type="button" size="lg" fullWidth onClick={next}
                    disabled={step === 0 && branchExpired}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed" iconRight={<MdArrowForward size={16} />}>
                    Continue
                  </Button>
                ) : (
                  <Button type="button" size="lg" fullWidth loading={submitting}
                    className="bg-violet-600 hover:bg-violet-700" icon={<MdQrCode2 size={16} />} onClick={handleSubmit}>
                    Join Queue
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
