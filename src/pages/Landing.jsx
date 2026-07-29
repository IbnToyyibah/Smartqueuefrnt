import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdArrowForward, MdCheckCircle, MdAccessTime, MdPeople, MdBarChart,
  MdQrCode2, MdNotifications, MdDashboard, MdStar,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdPhone, MdEmail,
  MdLocalHospital, MdAccountBalance, MdStorefront, MdFlight, MdSchool,
} from 'react-icons/md'
import PublicLayout from '../components/layout/PublicLayout'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: 'easeOut', delay },
})

/* ── Data ──────────────────────────────────────────── */
const FEATURES = [
  { icon: '📅', title: 'Online Appointment Booking', desc: 'Allow customers to pre-book slots and reduce walk-in congestion at peak hours.' },
  { icon: '⭐', title: 'Customer Feedback System', desc: 'Capture real-time ratings after every service interaction at every counter.' },
  { icon: '🧳', title: 'Multi-Branch Management', desc: 'Oversee all locations from one dashboard. Compare performance across branches.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Customer Joins Queue', desc: 'Scans a QR code, visits the web app, or uses a kiosk to register and receive a virtual ticket.' },
  { step: '02', title: 'Staff Manages the List', desc: 'Counter agents see the live queue, call next, handle no-shows, and transfer customers.' },
  { step: '03', title: 'Display Board Calls Number', desc: 'The real-time display board shows "Now Calling W001" so customers know when to approach.' },
  { step: '04', title: 'Service Completed', desc: 'Agent marks served. Customer receives a satisfaction prompt. Data is logged instantly.' },
]

const INDUSTRIES = [
  { label: 'Healthcare', desc: 'Manage patient queues and appointment arrivals smoothly', icon: <MdLocalHospital size={20} className="text-violet-600 shrink-0" /> },
  { label: 'Banking', desc: 'Organize branch queues and service requests efficiently', icon: <MdAccountBalance size={20} className="text-violet-600 shrink-0" /> },
  { label: 'Retail', desc: 'Control store traffic and checkout waiting lines', icon: <MdStorefront size={20} className="text-violet-600 shrink-0" /> },
  { label: 'Government', desc: 'Handle high-volume public service queues with ease', icon: <MdAccountBalance size={20} className="text-violet-600 shrink-0" /> },
  { label: 'Airports', desc: 'Streamline check-in, boarding, and service counters', icon: <MdFlight size={20} className="text-violet-600 shrink-0" /> },
  { label: 'Education', desc: 'Manage registration, admin offices, and student queues', icon: <MdSchool size={20} className="text-violet-600 shrink-0" /> },
]

const WHY_SWITCH = [
  { icon: <MdAccessTime size={22} className="text-indigo-500" />, text: 'Cut wait times by up to 35%', border: 'border-l-4 border-indigo-500' },
  { icon: <MdPeople size={22} className="text-emerald-500" />, text: 'Serve more customers', border: 'border-l-4 border-emerald-500' },
  { icon: <MdBarChart size={22} className="text-violet-500" />, text: 'Make decisions with data', border: 'border-l-4 border-violet-500' },
]

const WHY_CHOOSE = [
  { icon: '🌐', label: '70+ Countries Served', bg: 'bg-indigo-600' },
  { icon: '🛡️', label: 'Enterprise-Grade Security', bg: 'bg-purple-600' },
  { icon: '🏭', label: 'Built for Every Industry', bg: 'bg-red-500' },
  { icon: '⭐', label: 'Proven at Scale', bg: 'bg-amber-500' },
]

const CUSTOMER_FLOW_POINTS = [
  'Route customers by service type, language, or priority',
  'Balance workload across counters and branches automatically',
  'Spot bottlenecks with heat-map and peak-hour data',
  'Improve the end-to-end experience, not just the wait',
]

const BLOG_POSTS = [
  { tag: 'Queue Tips', title: 'How to End the Frustration of Long Queues Ever', accent: 'text-violet-600', bg: 'from-violet-100 to-indigo-100' },
  { tag: 'Government', title: 'Why Government Offices Must Modernize Their Queues Before 2026', accent: 'text-indigo-600', bg: 'from-blue-100 to-violet-100' },
  { tag: 'Business', title: '10 Benefits of Using Queue Management Software in Your Business', accent: 'text-purple-600', bg: 'from-purple-100 to-pink-100' },
]

const FAQS = [
  { q: 'What is SmartQueue and who is it for?', a: 'SmartQueue is a cloud-based queue management platform for hospitals, banks, government offices, and any high-footfall service environment. It replaces physical waiting lines with a virtual, trackable queue experience.' },
  { q: 'How does SmartQueue improve customer experience and reduce wait times?', a: 'Customers join remotely, track their live position, and receive automatic notifications as their turn approaches — eliminating uncertainty and crowded waiting areas.' },
  { q: 'Is SmartQueue suitable for my industry or organisation size?', a: 'Yes. SmartQueue supports single branches and enterprise-wide multi-branch deployments. It is used in healthcare, banking, retail, government, airports, and education.' },
  { q: "What's included in the free trial, and how do I get started?", a: 'The free trial includes full access to all features for 14 days. No credit card required. Sign up, run the seed script to populate demo data, and start serving customers within minutes.' },
  { q: 'How does SmartQueue integrate with my existing systems?', a: 'SmartQueue exposes a REST API and Socket.IO events so it can integrate with existing CRMs, appointment systems, ERP tools, and display hardware.' },
]

const FOOTER_LINKS = {
  COMPANY: ['About Us', 'Our Partners', 'Contact Us', 'Refund', 'Privacy Policy', 'Terms & Conditions', 'Security'],
  'WHO USES SMARTQUEUE?': ['Banking Queue System', 'Educational Queue System', 'Hospital Queue System', 'Public Sector Queue System', 'Retail Queue System'],
}

/* ── Accordion item ── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div layout className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-semibold text-slate-800 text-sm sm:text-base pr-4">{q}</span>
        <span className="shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
          {open ? <MdKeyboardArrowUp size={18} /> : <MdKeyboardArrowDown size={18} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Dashboard image hero mockup ── */
function DashboardMockup() {
  return (
    <div className="relative w-full h-full max-w-sm sm:max-w-md mx-auto select-none">
      <div className="h-full min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
        <img
          src="/Dashboard.png"
          alt="SmartQueue Dashboard"
          className="w-full h-full object-cover object-center block"
          draggable={false}
        />
      </div>
    </div>
  )
}


/* ── Main Page component ── */
export default function Landing() {
  return (
    <PublicLayout>

      {/* ════════════════ HERO ════════════════ */}
      <section className="bg-white pt-6 pb-10 px-3 sm:px-4 lg:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch">
          {/* Left */}
          <motion.div {...fadeUp(0)} className="flex flex-col justify-center">
            <h1 className="text-4xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-xl">
              Queue Management System<br />That Ends the waits
            </h1>
            <p className="mt-4 text-black text-sm sm:text-base leading-relaxed max-w-md">
              SmartQueue is a cloud-based queue management system that replaces messy lines
              and paper tokens with organised, trackable, appointment-and-walk-in queues.
              Serve more customers, cut wait times, and give your team a real-time view of
              every queue, across one branch or hundreds.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-full transition-all text-sm">
                <MdStar size={16} /> Start Free Trial
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MdCheckCircle size={14} className="text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1"><MdCheckCircle size={14} className="text-emerald-500" /> Cancel anytime</span>
            </div>
          </motion.div>
          {/* Right — dashboard mockup */}
          <motion.div {...fadeUp(0.2)} className="relative pt-4 sm:pt-6 pb-4 sm:pb-6 px-0 sm:px-2 flex items-stretch">
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ════════════════ WHAT IS ════════════════ */}
      <section className="bg-slate-50 py-10 sm:py-12 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-center">
          {/* Left text */}
          <motion.div {...fadeUp(0)}>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
              What Is a Queue<br />Management System?
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              A queue management system is software that controls how customers enter,
              wait in, and are served through a line. Instead of a physical first-come-first-served
              queue, customers join virtually through a kiosk, QR code, or mobile app, and are called
              to the right counter automatically. The system tracks every step, shows live wait times,
              and gives managers data on service speed, staff performance, and peak hours.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 mt-4 text-violet-600 font-semibold text-sm hover:underline">
              Get started free <MdArrowForward size={16} />
            </Link>
          </motion.div>
          {/* Right — service desk mockup */}
          <motion.div {...fadeUp(0.2)} className="relative">
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6">
              {/* Ticket display */}
              <div className="bg-white rounded-2xl p-4 mb-3 flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center">
                  <p className="font-extrabold text-white text-xl">D0002</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Waiting Time</p>
                  <p className="text-2xl font-extrabold text-slate-800">00:00</p>
                </div>
              </div>
              {/* Counter table */}
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="bg-violet-600 grid grid-cols-4 text-white text-[10px] font-bold px-3 py-2">
                  <span>COUNTER</span><span>QUEUE NO.</span><span>COUNTER</span><span>QUEUE NO.</span>
                </div>
                {[['1', 'C001', '2', 'C006'], ['3', 'C003', '4', 'C007'], ['4', 'C005', '1', '—'], ['2', 'C006', '5', '—'], ['6', 'C007', '6', 'C005']].map((r, i) => (
                  <div key={i} className={`grid grid-cols-4 text-[10px] px-3 py-1.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    {r.map((c, j) => <span key={j} className="font-medium text-slate-700">{c}</span>)}
                  </div>
                ))}
              </div>
            </div>
            {/* Phone mockup overlay */}
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl border border-slate-100 p-3 w-32 text-center"
            >
              <div className="w-8 h-8 bg-violet-600 rounded-xl mx-auto flex items-center justify-center mb-1">
                <MdDashboard size={16} className="text-white" />
              </div>
              <p className="text-[9px] font-bold text-violet-600">It is your turn now!</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Ticket A004</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FEATURES GRID ════════════════ */}
      <section id="features" className="bg-slate-100 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Queue Management Software
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              SmartQueue adapts to any service environment. Powerful tools that help your
              team deliver a consistently great experience at every stage.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} {...fadeUp(i * 0.07)}
                className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-2 text-sm">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-3">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              How the SmartQueue System Works
            </h2>
            <p className="mt-4 text-violet-500 max-w-xl mx-auto text-sm">
              From customer check-in to service completion, SmartQueue organises every step
              of the journey to reduce waiting and improve service flow.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((s, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="h-36 bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center">
                  <div className="w-14 h-14 bg-violet-600 rounded-2xl text-white font-extrabold text-xl flex items-center justify-center">
                    {s.step}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider mb-1">Step {s.step}</p>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ INDUSTRIES ════════════════ */}
      <section className="bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Built for Every Industry
            </h2>
            <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm">
              Whether you run a hospital, bank, or government office — SmartQueue fits every environment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {INDUSTRIES.map((ind, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.06)}
                className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-5 py-3.5"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  {ind.icon}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{ind.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ind.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CUSTOMER FLOW ════════════════ */}
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp(0)}>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight">
              Customer Flow Management<br />From Entry to Exit
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-6">
              Customer flow management is about more than the line — it is the full journey a visitor
              takes through your space. SmartQueue maps that entire flow: how customers arrive, where
              they wait, which service they need, who serves them, and how long each stage takes.
              By routing people to the right department automatically and balancing load across staff,
              you remove bottlenecks before they form and keep every branch moving at a steady pace.
            </p>
            <ul className="flex flex-col gap-3">
              {CUSTOMER_FLOW_POINTS.map((pt, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <MdCheckCircle size={18} className="text-violet-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          {/* Right side visual */}
          <motion.div {...fadeUp(0.2)} className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-100 p-6 min-h-64 flex items-center justify-center">
              {/* Reminder notification card */}
              <div className="bg-white rounded-2xl p-4 w-64 relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-violet-500 rounded-full" />
                  <p className="text-xs font-bold text-slate-700">Reminder Message</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Dear <span className="font-bold text-slate-700">Alex Daniel</span>, your booking has been
                  confirmed with <strong>Service 1</strong> on 28 March, 2026 at 10:00AM – 11:30PM.
                </p>
                <div className="mt-3 bg-amber-400 rounded-xl px-4 py-2 text-center">
                  <p className="font-extrabold text-white text-lg tracking-widest">D0002</p>
                  <p className="text-[10px] text-white/80">Waiting Time 00:00</p>
                </div>
              </div>
              {/* QR badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="absolute bottom-4 left-4 bg-white rounded-2xl p-3 flex items-center gap-2"
              >
                <MdQrCode2 size={28} className="text-violet-600" />
                <p className="text-[10px] font-bold text-slate-700">Scan to Check-In</p>
              </motion.div>
              {/* Staff served chart badge */}
              <motion.div
                animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute top-4 right-4 bg-white rounded-2xl p-3"
              >
                <p className="text-[10px] font-bold text-slate-700 mb-2">Served by Staff</p>
                <div className="flex items-end gap-1 h-8">
                  {[40, 65, 50, 80, 70, 90].map((h, i) => (
                    <div key={i} className={`w-3 rounded-sm ${i % 2 === 0 ? 'bg-violet-400' : 'bg-indigo-300'}`}
                      style={{ height: `${h}%` }} />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ WHY SWITCH ════════════════ */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Why Businesses Switch to a Queue<br />Management System
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {WHY_SWITCH.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}
                className={`bg-white rounded-2xl p-5 flex items-center gap-4 ${item.border}`}>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <p className="font-semibold text-slate-800 text-sm">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ WHY CHOOSE ════════════════ */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-600 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              WHY CHOOSE US
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Why choose SmartQueue?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
              SmartQueue goes beyond queues. We help teams cut wait times, run smoother operations,
              and deliver service visitors and patients trust — built for every industry, at any scale.
            </p>
            <p className="mt-4 text-violet-600 font-semibold text-sm cursor-pointer hover:underline">
              See how SmartQueue compares to other platforms →
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 mt-7 bg-violet-600 hover:bg-violet-700 text-white font-bold px-9 py-4 rounded-full transition-all text-base">
              Book a Free Demo
            </Link>
          </motion.div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {WHY_CHOOSE.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-3">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                  {item.icon}
                </div>
                <p className="font-semibold text-slate-800 text-sm text-left">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ BLOG ════════════════ */}
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Resources</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Latest from SmartQueue</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}
                className="rounded-3xl border border-slate-100 overflow-hidden">
                <div className={`h-36 bg-gradient-to-br ${post.bg} flex items-center justify-center p-6`}>
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center">
                        <MdDashboard size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-violet-700">SmartQueue</span>
                    </div>
                    <p className={`font-extrabold text-sm leading-snug ${post.accent}`}>
                      {post.title.split(' ').slice(0, 6).join(' ')}…
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-violet-500 font-bold uppercase tracking-widest mb-2">{post.tag}</p>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{post.title}</h3>
                  <button className="mt-3 text-violet-600 text-xs font-semibold hover:underline flex items-center gap-1">
                    Read more <MdArrowForward size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FAQ ════════════════ */}
      <section className="bg-slate-900 py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i} {...fadeUp(i * 0.06)}>
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA BANNER ════════════════ */}
      <section className="bg-violet-600 py-16 px-4 sm:px-6">
        <motion.div {...fadeUp()} className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Eliminate the Waiting-Room Problem?
          </h2>
          <p className="text-violet-200 mb-8">
            Get started in minutes. No credit card required for the pilot program.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 py-3.5 rounded-full transition-all">
              Start Free Trial <MdArrowForward size={18} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-3.5 rounded-full transition-all">
              Sign in to Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <MdDashboard size={16} className="text-white" />
                </div>
                <span className="font-extrabold text-white text-base">SmartQueue</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">
                Smart Queue Management System — replacing physical lines with virtual, trackable experiences.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([col, links]) => (
              <div key={col}>
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">{col}</p>
                <ul className="flex flex-col gap-2">
                  {links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-1">
                        <span className="text-violet-600">›</span> {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Sales & support */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">SALES AND SUPPORT</p>
              <div className="flex flex-col gap-2 text-xs text-slate-400">
                {['+234 1 234 5678', '+234 9 876 5432', '+234 84 123 456'].map(n => (
                  <a key={n} href={`tel:${n}`} className="flex items-center gap-2 hover:text-violet-400">
                    <MdPhone size={13} className="text-violet-500" /> {n}
                  </a>
                ))}
                <a href="mailto:info@smartqueue.com" className="flex items-center gap-2 hover:text-violet-400 mt-1">
                  <MdEmail size={13} className="text-violet-500" /> info@smartqueue.com
                </a>
              </div>
              {/* Social icons */}
              <div className="flex gap-2 mt-4">
                {['f', '𝕏', 'p', 'ig'].map(s => (
                  <div key={s} className="w-8 h-8 bg-slate-800 hover:bg-violet-600 rounded-lg flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['PCI DSS', 'AICPA SOC', 'HIPAA', 'GDPR', 'CCPA'].map(b => (
              <div key={b} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-300">
                {b}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            Copyright © 2026 SmartQueue.com | All Rights Reserved.
          </div>
        </div>
      </footer>

    </PublicLayout>
  )
}
