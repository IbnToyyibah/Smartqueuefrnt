import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdArrowForward, MdCheckCircle, MdAccessTime, MdPeople, MdBarChart,
  MdQrCode2, MdNotifications, MdDashboard, MdStar,
  MdKeyboardArrowDown, MdKeyboardArrowUp,
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
  { step: '01', title: 'Find Branch', desc: 'Locate your nearest hospital, bank, or service branch in seconds.' },
  { step: '02', title: 'Join Queue', desc: 'Scan a QR code or register online for your desired service.' },
  { step: '03', title: 'Get Ticket Number', desc: 'Receive your live ticket number, position, and estimated wait time.' },
  { step: '04', title: 'Track & Get Served', desc: 'Track your turn in real time and approach the counter when called.' },
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
  COMPANY: ['About', 'Contact', 'Privacy', 'Terms'],
  SOLUTIONS: ['Healthcare', 'Banking', 'Retail', 'Government'],
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
              Queue Management System<br />That Ends the Wait
            </h1>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-md">
              SmartQueue replaces physical lines with organised, trackable virtual queues to cut wait times and boost productivity.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
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
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mb-3">
              SmartQueue replaces physical waiting lines with virtual check-ins, automated ticket calling, and real-time performance tracking.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:underline">
              Get started free <MdArrowForward size={16} />
            </Link>
          </motion.div>
          {/* Right — How.jpeg illustration */}
          <motion.div {...fadeUp(0.2)} className="relative flex items-center justify-center">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white p-2.5 shadow-sm w-full">
              <img
                src="/How.jpeg"
                alt="How SmartQueue works"
                className="w-full max-h-[340px] sm:max-h-[380px] object-contain block mx-auto rounded-2xl"
              />
            </div>
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
          {/* Left - Image */}
          <motion.div {...fadeUp(0)} className="relative flex items-center justify-center">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white p-2.5 shadow-sm w-full">
              <img
                src="/Queue ticketting.jpg"
                alt="Customer Flow Management - Queue Ticketing"
                className="w-full max-h-[340px] sm:max-h-[380px] object-contain block mx-auto rounded-2xl"
              />
            </div>
          </motion.div>

          {/* Right - Text */}
          <motion.div {...fadeUp(0.2)}>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
              Customer Flow Management<br />From Entry to Exit
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              SmartQueue maps the complete customer journey, automatically routing visitors to the right department to eliminate bottlenecks and keep service moving smoothly.
            </p>
            <ul className="flex flex-col gap-2.5">
              {CUSTOMER_FLOW_POINTS.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <MdCheckCircle size={16} className="text-violet-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ WHY SWITCH ════════════════ */}
      <section className="bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Businesses Switch to SmartQueue
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {WHY_SWITCH.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}
                className={`bg-white rounded-xl p-4 flex items-center gap-3 ${item.border}`}>
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ WHY CHOOSE ════════════════ */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp()}>
            <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-600 text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              WHY CHOOSE US
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Why Choose SmartQueue?
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
              Cut wait times, streamline operations, and deliver service visitors trust.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 mt-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-full transition-all text-xs sm:text-sm">
              Book a Free Demo
            </Link>
          </motion.div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WHY_CHOOSE.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)}
                className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-2.5">
                <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center text-base shrink-0 text-white`}>
                  {item.icon}
                </div>
                <p className="font-semibold text-slate-800 text-xs text-left">{item.label}</p>
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
      <section className="relative overflow-hidden py-20 px-4 sm:px-6">
        {/* Background Image: Tickets.jpg */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/Tickets.jpg')" }}
        />
        {/* Gradient Overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/90 via-violet-900/85 to-indigo-950/90 backdrop-blur-xs" />

        {/* Decorative Ticket.jpg and Tickets.jpg preview cards */}
        <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 w-52 h-36 rounded-2xl overflow-hidden border border-white/20 shadow-2xl -rotate-6 opacity-75">
          <img src="/Ticket.jpg" alt="Queue Ticket" className="w-full h-full object-cover" />
        </div>
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-52 h-36 rounded-2xl overflow-hidden border border-white/20 shadow-2xl rotate-6 opacity-75">
          <img src="/Tickets.jpg" alt="Queue Tickets" className="w-full h-full object-cover" />
        </div>

        <motion.div {...fadeUp()} className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-violet-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            GET STARTED TODAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Ready to Eliminate the Waiting-Room Problem?
          </h2>
          <p className="text-violet-200 mb-8 text-base max-w-xl mx-auto">
            Get started in minutes. No credit card required for the pilot program.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl">
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
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 border-t border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <MdDashboard size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-white text-sm">SmartQueue</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-medium">
            <a href="#" className="hover:text-violet-400 transition-colors">About</a>
            <a href="#" className="hover:text-violet-400 transition-colors">Solutions</a>
            <a href="#" className="hover:text-violet-400 transition-colors">Contact</a>
            <a href="#" className="hover:text-violet-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-violet-400 transition-colors">Terms</a>
          </div>

          <p className="text-slate-500">
            © 2026 SmartQueue. All rights reserved.
          </p>
        </div>
      </footer>

    </PublicLayout>
  )
}
