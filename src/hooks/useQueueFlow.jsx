import { useState, useEffect, useCallback } from 'react'
import { branchApi } from '../lib/api'
import { useNotifications } from '../context/NotificationContext'
import { canJoinBranch } from '../lib/queueHelpers'
import { sendWebPushNotification } from '../lib/pushNotificationService'

const BRANCH_CACHE_KEY = 'sq_branches_cache'

function readBranchCache() {
  try {
    const cached = sessionStorage.getItem(BRANCH_CACHE_KEY)
    if (!cached) return []
    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeBranchCache(branches) {
  try {
    sessionStorage.setItem(BRANCH_CACHE_KEY, JSON.stringify(branches))
  } catch {
    // ignore quota errors
  }
}

export function useQueueJoinFlow({ initialForm, initialBranchId = '', joinMethod, initialStep = 0 }) {
  const { notify, enableWebPush } = useNotifications()

  const [branches, setBranches] = useState(() => {
    const cached = readBranchCache()
    return cached.length ? cached : []
  })
  const [loadingBranches, setLoadingBranches] = useState(() => branches.length === 0)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [step, setStep] = useState(initialStep)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    ...initialForm,
    branchId: initialBranchId || initialForm.branchId || '',
  })
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    let alive = true

    branchApi.list()
      .then(({ branches: branchList }) => {
        if (!alive || !Array.isArray(branchList)) return
        setBranches(branchList)
        writeBranchCache(branchList)

        if (initialBranchId && branchList.find((branch) => branch._id === initialBranchId)) {
          setStep((current) => (current === 0 ? 1 : current))
        }
      })
      .catch((err) => {
        if (!alive) return
        if (branches.length === 0) {
          notify('error', 'Could not load branches', err?.message || 'Please refresh.')
        }
      })
      .finally(() => {
        if (alive) setLoadingBranches(false)
      })

    return () => { alive = false }
  }, [branches.length, initialBranchId, notify])

  useEffect(() => {
    if (!form.branchId) {
      queueMicrotask(() => setServices([]))
      return
    }

    const selectedBranch = branches.find((branch) => branch._id === form.branchId)
    if (selectedBranch?.services?.length) {
      const mapped = selectedBranch.services.map((service) => ({
        ...service,
        id: service.id || service._id,
      }))
      queueMicrotask(() => {
        setServices(mapped)
        setLoadingServices(false)
      })
      return
    }

    let alive = true
    queueMicrotask(() => setLoadingServices(true))

    branchApi.getServices(form.branchId)
      .then(({ services: serviceList }) => {
        if (!alive) return
        setServices(Array.isArray(serviceList) ? serviceList : [])
      })
      .catch(() => {
        if (!alive) return
        notify('error', 'Could not load services', 'Please select another branch or refresh.')
      })
      .finally(() => {
        if (alive) setLoadingServices(false)
      })

    return () => { alive = false }
  }, [form.branchId, branches, notify])

  const selectedBranch = branches.find((branch) => branch._id === form.branchId)
  const branchExpired = Boolean(selectedBranch && !canJoinBranch(selectedBranch))
  const activeServices = services.filter((service) => service.active !== false)

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  const validateStep = useCallback(() => {
    const nextErrors = {}

    if (step === 0) {
      if (!form.branchId) nextErrors.branchId = 'Please select a branch.'
      if (branchExpired) nextErrors.branchId = "This branch's subscription has expired. Please select another branch."
    }

    if (step === 1 && !form.serviceId) {
      nextErrors.serviceId = 'Please select a service.'
    }

    if (step === 2) {
      if (!form.name.trim()) nextErrors.name = 'Your name is required.'
      if (!form.email.trim() && !form.phone.trim()) nextErrors.contact = 'Provide at least an email or phone number.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [branchExpired, form.branchId, form.email, form.name, form.phone, form.serviceId, step])

  const next = useCallback(() => {
    if (validateStep()) {
      if (step === 1) {
        // Request Web Push permission early when moving to details step
        enableWebPush().catch(console.error)
      }
      setStep((current) => current + 1)
    }
  }, [enableWebPush, step, validateStep])

  const back = useCallback(() => setStep((current) => Math.max(current - 1, 0)), [])

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return
    setSubmitting(true)

    try {
      const result = await joinMethod(form)
      const ticketResult = result?.ticket || result
      setTicket(ticketResult)
      setStep(3)

      const ticketNum = ticketResult.ticketNumber || ticketResult.ticket_number || ticketResult._id

      // Send Web Push Notification
      sendWebPushNotification(`Ticket #${ticketNum} Issued!`, {
        body: `You are in line at ${selectedBranch?.name || 'SmartQueue'}. Dynamic est. wait: ${ticketResult.estimatedWait || 10} mins.`,
        tag: `ticket-${ticketNum}`,
      })

      return ticketResult
    } catch (err) {
      notify('error', 'Failed to join queue', err?.message || 'Please try again.')
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [form, joinMethod, notify, selectedBranch, validateStep])

  return {
    branches,
    loadingBranches,
    services,
    loadingServices,
    selectedBranch,
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
  }
}
