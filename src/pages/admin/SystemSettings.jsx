import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdSave, MdSecurity, MdSettings, MdNotifications, MdStorage, MdCheckCircle } from 'react-icons/md'
import { useNotifications } from '../../context/NotificationContext'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'

function Section({ icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-indigo-600">{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-3 border-b border-slate-50 last:border-0">
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer"/>
        <div className="w-9 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"/>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  )
}

export default function SystemSettings() {
  const { notify } = useNotifications()

  const [general, setGeneral] = useState({
    platformName: 'SmartQueue', supportEmail: 'support@smartqueue.com',
    defaultLanguage: 'English', timezone: 'Africa/Lagos', sessionTimeout: 30,
  })

  const [security, setSecurity] = useState({
    mfa: false, passwordExpiry: true, sessionLock: true,
    auditLog: true, ipWhitelist: false,
  })

  const [realtime, setRealtime] = useState({
    websockets: true, pollingFallback: true, updateInterval: 15,
    maxConnections: 500,
  })

  const [notifications, setNotifications] = useState({
    globalSMS: true, globalEmail: true, adminAlerts: true,
    systemAlerts: true, weeklyReport: true,
  })

  const save = (section) => notify('success', 'Settings saved', `${section} settings updated.`)

  return (
    <AppLayout>
      <PageHeader title="System Settings" subtitle="Platform-wide configuration and security controls"
        breadcrumb="Super Admin"/>

      <div className="max-w-3xl flex flex-col gap-6">

        {/* General */}
        <Section icon={<MdSettings size={18}/>} title="General">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { k:'platformName',    label:'Platform name',    type:'text' },
              { k:'supportEmail',    label:'Support email',    type:'email' },
              { k:'defaultLanguage', label:'Default language', type:'text' },
              { k:'timezone',        label:'Timezone',         type:'text' },
              { k:'sessionTimeout',  label:'Session timeout (min)', type:'number' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
                <input type={f.type} value={general[f.k]}
                  onChange={e => setGeneral(g => ({ ...g, [f.k]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => save('General')}>Save</Button>
          </div>
        </Section>

        {/* Security */}
        <Section icon={<MdSecurity size={18}/>} title="Security & Access Control">
          <Toggle label="Multi-factor authentication (MFA)"
            desc="Require MFA for all staff and admin logins."
            checked={security.mfa} onChange={v => setSecurity(s => ({...s, mfa:v}))}/>
          <Toggle label="Password expiry (90 days)"
            desc="Force password reset every 90 days for all users."
            checked={security.passwordExpiry} onChange={v => setSecurity(s => ({...s, passwordExpiry:v}))}/>
          <Toggle label="Auto session lock"
            desc="Lock idle sessions after the configured timeout."
            checked={security.sessionLock} onChange={v => setSecurity(s => ({...s, sessionLock:v}))}/>
          <Toggle label="Audit logging"
            desc="Record all admin and staff actions to the audit trail."
            checked={security.auditLog} onChange={v => setSecurity(s => ({...s, auditLog:v}))}/>
          <Toggle label="IP whitelist enforcement"
            desc="Restrict admin dashboard access to whitelisted IPs only."
            checked={security.ipWhitelist} onChange={v => setSecurity(s => ({...s, ipWhitelist:v}))}/>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => save('Security')}>Save</Button>
          </div>
        </Section>

        {/* Real-time */}
        <Section icon={<MdStorage size={18}/>} title="Real-Time Engine">
          <Toggle label="WebSocket connections"
            desc="Primary real-time transport (Socket.IO / native WS)."
            checked={realtime.websockets} onChange={v => setRealtime(r => ({...r, websockets:v}))}/>
          <Toggle label="Polling fallback"
            desc="Enable HTTP polling for clients that cannot use WebSockets."
            checked={realtime.pollingFallback} onChange={v => setRealtime(r => ({...r, pollingFallback:v}))}/>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { k:'updateInterval',  label:'Update interval (sec)', min:5,   max:60  },
              { k:'maxConnections',  label:'Max concurrent connections', min:50,  max:5000 },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{f.label}</label>
                <input type="number" min={f.min} max={f.max} value={realtime[f.k]}
                  onChange={e => setRealtime(r => ({...r, [f.k]: Number(e.target.value)}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => save('Real-time engine')}>Save</Button>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<MdNotifications size={18}/>} title="Global Notification Controls">
          <Toggle label="SMS delivery (platform-wide)"
            checked={notifications.globalSMS} onChange={v => setNotifications(n => ({...n, globalSMS:v}))}/>
          <Toggle label="Email delivery (platform-wide)"
            checked={notifications.globalEmail} onChange={v => setNotifications(n => ({...n, globalEmail:v}))}/>
          <Toggle label="Admin alert emails"
            desc="Send operational alerts to all branch admins."
            checked={notifications.adminAlerts} onChange={v => setNotifications(n => ({...n, adminAlerts:v}))}/>
          <Toggle label="System health alerts"
            desc="Notify super admins on degraded service or downtime."
            checked={notifications.systemAlerts} onChange={v => setNotifications(n => ({...n, systemAlerts:v}))}/>
          <Toggle label="Weekly performance report"
            desc="Auto-email platform summary every Monday morning."
            checked={notifications.weeklyReport} onChange={v => setNotifications(n => ({...n, weeklyReport:v}))}/>
          <div className="flex justify-end mt-4">
            <Button size="sm" icon={<MdSave size={16}/>} onClick={() => save('Notification')}>Save</Button>
          </div>
        </Section>

      </div>
    </AppLayout>
  )
}
