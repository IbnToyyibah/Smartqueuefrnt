import { motion, AnimatePresence } from 'framer-motion'
import { MdArrowForward, MdArrowBack, MdQrCode2 } from 'react-icons/md'
import { useQueue } from '../../context/QueueContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import { TIME_SLOTS, QUEUE_STEPS } from '../../lib/queueHelpers'
import {
  BranchSelector,
  ServiceSelector,
  QueueProgress,
  QueueDetailsForm,
  QueueConfirmation,
} from '../../components/customer/queue'
import { useQueueJoinFlow } from '../../hooks/useQueueFlow'

const DEFAULT_FORM = {
  branchId: '',
  serviceId: '',
  timeSlot: TIME_SLOTS[0],
  name: '',
  email: '',
  phone: '',
  notifyChannel: 'both',
}

export default function QueueRegistration() {
  const { joinQueue } = useQueue()
  const { user } = useAuth()
  const { notify } = useNotifications()

  const {
    branches,
    loadingBranches,
    loadingServices,
    activeServices,
    form,
    setField,
    errors,
    step,
    next,
    back,
    handleSubmit,
    submitting,
    ticket,
  } = useQueueJoinFlow({
    initialForm: {
      ...DEFAULT_FORM,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      notifyChannel: user?.notifyChannel || 'both',
    },
    joinMethod: joinQueue,
  })
  const onSubmit = async () => {
    try {
      const ticketResult = await handleSubmit()
      notify('success', 'Ticket confirmed', `Your ticket is ${ticketResult.ticketNumber}.`)
    } catch {
      // handleSubmit already notifies on failure
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Join a Queue" subtitle="Reserve your spot remotely and save time." breadcrumb="Customer" />
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <QueueProgress current={step} total={QUEUE_STEPS.length} />

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="branch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Select branch</h2>
                  <p className="text-sm text-slate-500">Choose the branch you want to visit.</p>
                </div>
                <BranchSelector
                  branches={branches}
                  selectedBranchId={form.branchId}
                  loading={loadingBranches}
                  onSelect={(value) => setField('branchId', value)}
                />
                {errors.branchId && <p className="mt-4 text-xs text-red-500">{errors.branchId}</p>}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Choose service</h2>
                  <p className="text-sm text-slate-500">Select the service you need.</p>
                </div>
                <ServiceSelector
                  services={activeServices}
                  selectedServiceId={form.serviceId}
                  loading={loadingServices}
                  onSelect={(value) => setField('serviceId', value)}
                />
                {errors.serviceId && <p className="mt-4 text-xs text-red-500">{errors.serviceId}</p>}
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred time slot</label>
                  <select
                    value={form.timeSlot}
                    onChange={(event) => setField('timeSlot', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <QueueDetailsForm form={form} errors={errors} onChange={setField} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <QueueConfirmation ticket={ticket} />
              </motion.div>
            )}
          </AnimatePresence>

          {step < 3 && (
            <div className="flex flex-wrap gap-3 mt-8">
              {step > 0 && (
                <Button variant="secondary" size="lg" onClick={back} icon={<MdArrowBack size={18} />}>
                  Back
                </Button>
              )}
              <div className="flex-1 min-w-45">
                {step < 2 ? (
                  <Button size="lg" fullWidth onClick={next} iconRight={<MdArrowForward size={18} />}>
                    Continue
                  </Button>
                ) : (
                  <Button size="lg" fullWidth loading={submitting} onClick={onSubmit} icon={<MdQrCode2 size={18} />}>
                    Join Queue
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
