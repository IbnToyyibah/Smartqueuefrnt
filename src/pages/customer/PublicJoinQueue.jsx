import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MdArrowForward, MdArrowBack, MdQrCode2 } from 'react-icons/md'
import { queueApi } from '../../lib/api'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import { TIME_SLOTS, QUEUE_STEPS, canJoinBranch, getBranchSubscriptionStatus } from '../../lib/queueHelpers'
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

export default function PublicJoinQueue() {
  const [searchParams] = useSearchParams()
  const branchQueryParam = searchParams.get('branch')

  const {
    branches,
    loadingBranches,
    loadingServices,
    branchExpired,
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
      branchId: branchQueryParam || '',
    },
    initialBranchId: branchQueryParam || '',
    joinMethod: queueApi.join,
  })


  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-violet-50/60 to-indigo-50/40 flex items-center justify-center px-4 py-10">
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
            <QueueProgress current={step} total={QUEUE_STEPS.length} />

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
                    onSelect={(value) => {
                      setField('branchId', value)
                      setField('serviceId', '')
                    }}
                    isBranchDisabled={(branch) => !canJoinBranch(branch)}
                    renderStatus={(branch) => {
                      const status = getBranchSubscriptionStatus(branch)
                      return status === 'suspended' ? 'Suspended' : 'Expired'
                    }}
                  />

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

              {step === 1 && (
                <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Choose service</h2>
                    <p className="text-sm text-slate-500">Select the service that fits your visit.</p>
                  </div>

                  <ServiceSelector
                    services={activeServices}
                    selectedServiceId={form.serviceId}
                    loading={loadingServices}
                    onSelect={(value) => setField('serviceId', value)}
                  />

                  {errors.serviceId && <p className="text-xs text-red-500 mt-4">{errors.serviceId}</p>}

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
              <div className="flex items-center gap-3 mt-7">
                {step > 0 && (
                  <Button type="button" variant="secondary" size="lg" onClick={back} icon={<MdArrowBack size={16} />}>Back</Button>
                )}
                <div className="flex-1 min-w-0">
                  {step < 2 ? (
                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      onClick={next}
                      disabled={step === 0 && branchExpired}
                      className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      iconRight={<MdArrowForward size={16} />}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      loading={submitting}
                      onClick={handleSubmit}
                      className="bg-violet-600 hover:bg-violet-700"
                      icon={<MdQrCode2 size={16} />}
                    >
                      Join Queue
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
