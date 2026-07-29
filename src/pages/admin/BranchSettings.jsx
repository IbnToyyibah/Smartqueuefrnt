import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MdBusiness,
  MdAccessTime,
  MdNotifications,
  MdSave,
  MdCheckCircle,
  MdAdd,
  MdDelete,
} from 'react-icons/md'
import { useNotifications } from '../../context/NotificationContext'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function BranchSettings() {
  const { notify } = useNotifications()

  const [branch, setBranch] = useState({
    name:    'Lagos Main Branch',
    address: '14 Marina Street, Lagos Island',
    phone:   '+234 1 234 5678',
    email:   'lagos@smartqueue.com',
    maxCapacity: 150,
  })

  const [hours, setHours] = useState(
    DAYS.reduce((acc, d) => ({
      ...acc,
      [d]: { open: d === 'Sunday' ? false : true, from: '08:00', to: '17:00' },
    }), {})
  )

  const [notifications, setNotifications] = useState({
    confirmationMsg: true,
    milestone5:      true,
    milestone2:      true,
    calledAlert:     true,
    delayAlert:      true,
    smsEnabled:      true,
    emailEnabled:    true,
  })

  const [services, setServices] = useState([
    { id: 'sv1', name: 'General Inquiry',      duration: 8,  active: true },
    { id: 'sv2', name: 'Account Services',     duration: 12, active: true },
    { id: 'sv3', name: 'Loans & Credit',       duration: 20, active: true },
    { id: 'sv4', name: 'Document Processing',  duration: 10, active: true },
    { id: 'sv5', name: 'Medical Consultation', duration: 15, active: false },
    { id: 'sv6', name: 'Complaints',           duration: 10, active: true },
  ])

  const handleSave = (section) => {
    notify('success', 'Settings saved', `${section} settings updated successfully.`)
  }

  const toggleService = (id) =>
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s))

  const updateDuration = (id, val) =>
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, duration: Number(val) } : s))

  return (
    <AppLayout>
      <PageHeader
        title="Branch Settings"
        subtitle="Configure your branch preferences and operating parameters"
        breadcrumb="Branch Admin"
      />

      <div className="max-w-3xl flex flex-col gap-6">

        {/* ── Branch info ── */}
        <Section icon={<MdBusiness size={18}/>} title="Branch Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Branch name',    key: 'name',        type: 'text' },
              { label: 'Address',        key: 'address',     type: 'text' },
              { label: 'Phone',          key: 'phone',       type: 'tel'  },
              { label: 'Email',          key: 'email',       type: 'email'},
              { label: 'Max capacity',   key: 'maxCapacity', type: 'number' },
            ].map((f) => (
              <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={branch[f.key]}
                  onChange={(e) => setBranch((b) => ({ ...b, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => handleSave('Branch info')}>
              Save changes
            </Button>
          </div>
        </Section>

        {/* ── Operating hours ── */}
        <Section icon={<MdAccessTime size={18}/>} title="Operating Hours">
          <div className="flex flex-col gap-2">
            {DAYS.map((day) => {
              const h = hours[day]
              return (
                <div key={day} className="grid grid-cols-12 items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-slate-700">{day}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox" checked={h.open}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...h, open: e.target.checked } }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                    <span className="text-xs text-slate-500">{h.open ? 'Open' : 'Closed'}</span>
                  </div>
                  {h.open && (
                    <div className="col-span-7 flex items-center gap-2">
                      <input type="time" value={h.from}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...h, from: e.target.value } }))}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input type="time" value={h.to}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...h, to: e.target.value } }))}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => handleSave('Operating hours')}>
              Save hours
            </Button>
          </div>
        </Section>

        {/* ── Services ── */}
        <Section icon={<MdCheckCircle size={18}/>} title="Active Services">
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={s.active}
                    onChange={() => toggleService(s.id)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <span className={`text-sm flex-1 font-medium ${s.active ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.name}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="1" max="120" value={s.duration}
                    onChange={(e) => updateDuration(s.id, e.target.value)}
                    disabled={!s.active}
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-40"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => handleSave('Services')}>
              Save services
            </Button>
          </div>
        </Section>

        {/* ── Notifications ── */}
        <Section icon={<MdNotifications size={18}/>} title="Notification Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'confirmationMsg', label: 'Confirmation on registration' },
              { key: 'milestone5',      label: 'Alert when 5 ahead' },
              { key: 'milestone2',      label: 'Alert when 2 ahead' },
              { key: 'calledAlert',     label: 'Alert when called' },
              { key: 'delayAlert',      label: 'Delay / cancellation notice' },
              { key: 'smsEnabled',      label: 'SMS delivery enabled' },
              { key: 'emailEnabled',    label: 'Email delivery enabled' },
            ].map((n) => (
              <label key={n.key} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notifications[n.key]}
                    onChange={(e) => setNotifications((prev) => ({ ...prev, [n.key]: e.target.checked }))}
                    className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </div>
                <span className="text-sm text-slate-700">{n.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => handleSave('Notification')}>
              Save notifications
            </Button>
          </div>
        </Section>
      </div>
    </AppLayout>
  )
}

function Section({ icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-indigo-600">{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}
