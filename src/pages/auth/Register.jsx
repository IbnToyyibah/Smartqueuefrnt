import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdPerson, MdEmail, MdPhone, MdLock,
  MdVisibility, MdVisibilityOff,
  MdArrowForward, MdArrowBack, MdCheckCircle, MdDashboard,
  MdCreditCard, MdStar, MdBusiness, MdLocationOn,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'

const ROLE_HOME = {
  customer: '/customer',
  staff: '/staff/dashboard',
  branch_admin: '/admin/branch',
}

/* Only 3 roles shown — super_admin cannot self-register */
const ROLES = [
  {
    id: 'customer',
    emoji: '🙋',
    title: 'Customer',
    desc: "Join queues, track your position, and get notified when it's your turn.",
    ring: 'ring-sky-400',
    bg: 'border-sky-300 bg-sky-50',
    check: 'bg-sky-500',
  },
  {
    id: 'staff',
    emoji: '🖥️',
    title: 'Counter Agent',
    desc: 'Counter Agent accounts are created by your Branch Admin after they register.',
    ring: 'ring-violet-400',
    bg: 'border-violet-300 bg-violet-50',
    check: 'bg-violet-500',
    infoOnly: true, // cannot self-register
  },
  {
    id: 'branch_admin',
    emoji: '🏢',
    title: 'Branch Admin',
    desc: 'Manage your branch, staff, counters and analytics. 14-day free trial included.',
    ring: 'ring-orange-400',
    bg: 'border-orange-300 bg-orange-50',
    check: 'bg-orange-500',
    trial: true,
  },
]

/* Steps: role → details → card (branch_admin only) → confirm */
function getSteps(role) {
  if (role === 'branch_admin') return ['Role', 'Details', 'Card & Trial', 'Confirm']
  if (role === 'staff') return ['Role'] // staff cannot proceed further
  return ['Role', 'Details', 'Confirm']
}

function StepBar({ current, steps }) {
  return (
    <div className="flex items-center gap-1 mb-7">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${done ? 'bg-violet-600 text-white' :
                active ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400' :
                  'bg-slate-100 text-slate-400'
                }`}>
                {done ? <MdCheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-violet-700' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full ${done ? 'bg-violet-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ id, label, icon, error, suffix, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
        {children}
        {suffix}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = (err) =>
  `w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow ${err ? 'border-red-300' : 'border-slate-200'}`

export default function Register() {
  const { register, loading } = useAuth()
  const { notify } = useNotifications()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    role: '', name: '', email: '', phone: '',
    password: '', confirmPassword: '',
    notifyChannel: 'both', agreeTerms: false,
    orgName: '', branchCity: '', branchAddress: '', branchCategory: 'other',
    // card fields (branch_admin only)
    cardHolder: '', cardNumber: '', cardExpiry: '', cardCvc: '',
  })

  const steps = getSteps(form.role)
  const isCardStep = form.role === 'branch_admin' && step === 2
  const isConfirmStep = step === steps.length - 1

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  /* Format card number as 1234 5678 9012 3456 */
  const handleCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
    set('cardNumber', formatted)
  }

  /* Format expiry as MM/YY */
  const handleExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    set('cardExpiry', formatted)
  }

  const validate = () => {
    const errs = {}
    if (step === 0 && !form.role) errs.role = 'Please select a role.'
    if (step === 0 && form.role === 'staff') errs.role = 'Counter Agent accounts are created by your Branch Admin.'
    if (step === 1) {
      if (!form.name.trim()) errs.name = 'Full name is required.'
      if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.'
      if (form.password.length < 8) errs.password = 'At least 8 characters.'
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
      if (form.role === 'branch_admin') {
        if (!form.orgName.trim()) errs.orgName = 'Branch name is required.'
        if (!form.branchCity.trim()) errs.branchCity = 'Branch city is required.'
        if (!form.branchAddress.trim()) errs.branchAddress = 'Branch address is required.'
      }
    }
    if (isCardStep) {
      const raw = form.cardNumber.replace(/\s/g, '')
      if (raw.length < 13) errs.cardNumber = 'Enter a valid card number.'
      if (!form.cardExpiry.match(/^\d{2}\/\d{2}$/)) errs.cardExpiry = 'Use MM/YY format.'
      if (!form.cardHolder.trim()) errs.cardHolder = 'Cardholder name is required.'
      if (form.cardCvc.length < 3) errs.cardCvc = 'Enter 3-4 digit CVC.'
    }
    if (isConfirmStep && !form.agreeTerms) errs.agreeTerms = 'You must agree to the terms.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    const res = await register({
      name: form.name, email: form.email,
      password: form.password, phone: form.phone,
      role: form.role, notifyChannel: form.notifyChannel,
      // send card details for branch_admin (backend validates & starts trial)
      ...(form.role === 'branch_admin' && {
        cardNumber: form.cardNumber.replace(/\s/g, ''),
        cardExpiry: form.cardExpiry,
        cardCvc: form.cardCvc,
        cardHolder: form.cardHolder,
        orgName: form.orgName,
        branchCity: form.branchCity,
        branchAddress: form.branchAddress,
        branchCategory: form.branchCategory,
      }),
    })
    if (res.success) {
      const msg = form.role === 'branch_admin'
        ? `Welcome ${res.user.name}! Your 14-day free trial has started.`
        : `Welcome to SmartQueue, ${res.user.name}!`
      notify('success', 'Account created!', msg)
      navigate(ROLE_HOME[form.role] ?? '/')
    } else {
      notify('error', 'Registration failed', res.message || 'Please try again.')
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-violet-50/60 to-indigo-50/40 flex items-center justify-center p-4 py-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 p-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <MdDashboard size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-lg">
              Smart<span className="text-violet-600">Queue</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h2>
          <p className="text-sm text-slate-500 mb-5">
            {step === 0 && 'Choose how you will use SmartQueue.'}
            {step === 1 && 'Enter your personal details.'}
            {isCardStep && 'Start your 14-day free trial — no charge today.'}
            {isConfirmStep && !isCardStep && 'Set your preferences and confirm.'}
          </p>

          <StepBar current={step} steps={steps} />

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait">

              {/* ── Step 0: Role ── */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">I am a…</p>
                  <div className="grid grid-cols-1 gap-3">
                    {ROLES.map(r => (
                      <button key={r.id} type="button" onClick={() => { set('role', r.id); setStep(0) }}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${form.role === r.id ? `${r.bg} ring-2 ${r.ring}` : 'border-slate-200 bg-white hover:border-violet-300'
                          }`}>
                        <span className="text-2xl shrink-0">{r.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                            {r.trial && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
                                <MdStar size={10} /> 14-day free trial
                              </span>
                            )}
                            {r.infoOnly && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                By Branch Admin only
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.desc}</p>
                        </div>
                        {form.role === r.id && !r.infoOnly && (
                          <span className={`absolute top-3 right-3 w-5 h-5 rounded-full ${r.check} flex items-center justify-center shrink-0`}>
                            <MdCheckCircle size={13} className="text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.role && <p className="text-xs text-red-500 mt-2">{errors.role}</p>}
                </motion.div>
              )}

              {/* ── Step 1: Details ── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4">
                  <Field id="name" label="Full name" icon={<MdPerson size={15} />} error={errors.name}>
                    <input id="name" type="text" value={form.name} autoComplete="name"
                      onChange={e => set('name', e.target.value)} placeholder="Your full name"
                      className={inputCls(errors.name)} />
                  </Field>
                  <Field id="email" label="Email address" icon={<MdEmail size={15} />} error={errors.email}>
                    <input id="email" type="email" value={form.email} autoComplete="email"
                      onChange={e => set('email', e.target.value)} placeholder="you@example.com"
                      className={inputCls(errors.email)} />
                  </Field>
                  <Field id="phone" label="Phone (optional)" icon={<MdPhone size={15} />} error={errors.phone}>
                    <input id="phone" type="tel" value={form.phone} autoComplete="tel"
                      onChange={e => set('phone', e.target.value)} placeholder="+234 800 000 0000"
                      className={inputCls(errors.phone)} />
                  </Field>
                  <Field id="password" label="Password" icon={<MdLock size={15} />} error={errors.password}
                    suffix={
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                      </button>
                    }>
                    <input id="password" type={showPw ? 'text' : 'password'} value={form.password}
                      autoComplete="new-password" onChange={e => set('password', e.target.value)}
                      placeholder="Min. 8 characters" className={inputCls(errors.password) + ' pr-10'} />
                  </Field>
                  <Field id="confirmPassword" label="Confirm password" icon={<MdLock size={15} />} error={errors.confirmPassword}>
                    <input id="confirmPassword" type={showPw ? 'text' : 'password'} value={form.confirmPassword}
                      autoComplete="new-password" onChange={e => set('confirmPassword', e.target.value)}
                      placeholder="Repeat password" className={inputCls(errors.confirmPassword)} />
                  </Field>
                  {form.role === 'branch_admin' && (
                    <>
                      <Field id="orgName" label="Branch name" icon={<MdBusiness size={15} />} error={errors.orgName}>
                        <input id="orgName" type="text" value={form.orgName}
                          onChange={e => set('orgName', e.target.value)} placeholder="Your branch or organization name"
                          className={inputCls(errors.orgName)} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field id="branchCity" label="City" icon={<MdLocationOn size={15} />} error={errors.branchCity}>
                          <input id="branchCity" type="text" value={form.branchCity}
                            onChange={e => set('branchCity', e.target.value)} placeholder="Lagos"
                            className={inputCls(errors.branchCity)} />
                        </Field>
                        <div>
                          <label htmlFor="branchCategory" className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                          <select id="branchCategory" value={form.branchCategory}
                            onChange={e => set('branchCategory', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500">
                            <option value="other">Other</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="government">Government</option>
                            <option value="retail">Retail</option>
                            <option value="banking">Banking</option>
                          </select>
                        </div>
                      </div>
                      <Field id="branchAddress" label="Branch address" icon={<MdLocationOn size={15} />} error={errors.branchAddress}>
                        <input id="branchAddress" type="text" value={form.branchAddress}
                          onChange={e => set('branchAddress', e.target.value)} placeholder="Street address"
                          className={inputCls(errors.branchAddress)} />
                      </Field>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Step 2 (branch_admin only): Card details ── */}
              {isCardStep && (
                <motion.div key="s2card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4">

                  {/* Trial info banner */}
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                    <MdStar size={20} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-800">14-Day Free Trial</p>
                      <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">
                        Your card will <strong>not</strong> be charged today. After 14 days, your plan will auto-renew unless you cancel.
                      </p>
                    </div>
                  </div>

                  {/* Card number */}
                  <Field id="cardNumber" label="Card number" icon={<MdCreditCard size={15} />} error={errors.cardNumber}>
                    <input id="cardNumber" type="text" value={form.cardNumber} inputMode="numeric"
                      onChange={e => handleCardNumber(e.target.value)} placeholder="1234 5678 9012 3456"
                      className={inputCls(errors.cardNumber) + ' font-mono tracking-widest'} />
                  </Field>

                  {/* Cardholder name */}
                  <Field id="cardHolder" label="Name on card" icon={<MdPerson size={15} />} error={errors.cardHolder}>
                    <input id="cardHolder" type="text" value={form.cardHolder} autoComplete="cc-name"
                      onChange={e => set('cardHolder', e.target.value)} placeholder="As it appears on your card"
                      className={inputCls(errors.cardHolder)} />
                  </Field>

                  {/* Expiry + CVC side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="cardExpiry" label="Expiry date" icon={<MdCreditCard size={15} />} error={errors.cardExpiry}>
                      <input id="cardExpiry" type="text" value={form.cardExpiry} inputMode="numeric"
                        onChange={e => handleExpiry(e.target.value)} placeholder="MM/YY"
                        className={inputCls(errors.cardExpiry) + ' font-mono'} />
                    </Field>
                    <Field id="cardCvc" label="CVC / CVV" icon={<MdLock size={15} />} error={errors.cardCvc}>
                      <input id="cardCvc" type="text" value={form.cardCvc} inputMode="numeric" maxLength={4}
                        onChange={e => set('cardCvc', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123"
                        className={inputCls(errors.cardCvc) + ' font-mono'} />
                    </Field>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <MdLock size={12} className="text-slate-400" />
                    Your card details are encrypted and secure. We never store your full card number.
                  </p>
                </motion.div>
              )}

              {/* ── Confirm step ── */}
              {isConfirmStep && (
                <motion.div key="sConfirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4">

                  {/* Summary card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SQ'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{form.name}</p>
                      <p className="text-xs text-slate-500">{form.email}</p>
                      <p className="text-xs text-violet-600 font-medium mt-1 capitalize">
                        {ROLES.find(r => r.id === form.role)?.title}
                        {form.role === 'branch_admin' && (
                          <span className="ml-2 text-orange-500">· 14-day trial starts today</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Notification preference */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">Notification preference</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ v: 'email', l: 'Email' }, { v: 'sms', l: 'SMS' }, { v: 'both', l: 'Both' }].map(o => (
                        <button key={o.v} type="button" onClick={() => set('notifyChannel', o.v)}
                          className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${form.notifyChannel === o.v ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-600 hover:border-violet-300'
                            }`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      I agree to the <span className="text-violet-600 font-medium">Terms of Service</span> and{' '}
                      <span className="text-violet-600 font-medium">Privacy Policy</span>.
                      {form.role === 'branch_admin' && (
                        <span className="block text-xs text-slate-400 mt-1">
                          Your 14-day free trial begins today. Cancel anytime before trial ends to avoid charges.
                        </span>
                      )}
                    </p>
                  </label>
                  {errors.agreeTerms && <p className="text-xs text-red-500 -mt-2">{errors.agreeTerms}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-7">
              {step > 0 && (
                <Button type="button" variant="secondary" size="lg" onClick={back} icon={<MdArrowBack size={17} />}>
                  Back
                </Button>
              )}
              {!isConfirmStep ? (
                <Button type="button" size="lg" fullWidth
                  onClick={form.role === 'staff' ? undefined : next}
                  disabled={form.role === 'staff'}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  iconRight={<MdArrowForward size={17} />}>
                  {form.role === 'staff' ? 'Contact your Branch Admin' : 'Continue'}
                </Button>
              ) : (
                <Button type="submit" size="lg" fullWidth loading={loading}
                  className="bg-violet-600 hover:bg-violet-700" iconRight={<MdCheckCircle size={17} />}>
                  {form.role === 'branch_admin' ? 'Start Free Trial' : 'Create Account'}
                </Button>
              )}
            </div>
          </form>

          <p className="text-sm text-center text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  )
}
