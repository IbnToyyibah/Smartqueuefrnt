export const SERVICE_ICONS = {
    general: '💬',
    account: '🏦',
    loans: '💳',
    consultation: '🩺',
    document: '📄',
    complaints: '📢',
    buying: '🛒',
    verification: '✅',
    registration: '📝',
    payment: '💰',
    inquiry: '❓',
    pharmacy: '💊',
    xray: '🩻',
    laboratory: '🔬',
    emergency: '🚨',
}

export const TIME_SLOTS = [
    'As soon as possible',
    '9:00 AM – 10:00 AM',
    '10:00 AM – 11:00 AM',
    '11:00 AM – 12:00 PM',
    '1:00 PM – 2:00 PM',
    '2:00 PM – 3:00 PM',
    '3:00 PM – 4:00 PM',
]

export const QUEUE_STEPS = ['Branch', 'Service', 'Details', 'Confirm']

export function getServiceLabel(service) {
    if (!service) return 'Unknown service'
    return service.name || service.label || 'Service'
}

export function getBranchLabel(branch) {
    if (!branch) return 'Unknown branch'
    return branch.name || branch.label || 'Branch'
}

export function getBranchSubscriptionStatus(branch) {
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

export function canJoinBranch(branch) {
    const status = getBranchSubscriptionStatus(branch)
    return status === 'active' || status === 'trial'
}

/**
 * Calculate Moving Average Service Duration (in minutes) for a given service type
 * @param {Array} completedTickets - History of tickets with status 'served'
 * @param {string|Object} serviceId - Target service identifier
 * @param {number} fallbackDuration - Default nominal duration from service settings (default 10)
 * @param {number} windowSize - Number of recent completed tickets to consider (default 5)
 */
export function calculateServiceMovingAverage(completedTickets = [], serviceTarget, fallbackDuration = 10, windowSize = 5) {
    const sId = typeof serviceTarget === 'object' ? (serviceTarget.id || serviceTarget._id) : serviceTarget

    const matched = completedTickets.filter((t) => {
        if (t.status !== 'served') return false
        const tid = typeof t.service === 'object' ? (t.service.id || t.service._id) : t.service
        return tid === sId && t.calledAt && t.servedAt
    })

    if (matched.length === 0) {
        return Number(fallbackDuration) || 10
    }

    const recent = matched.slice(-windowSize)
    const totalMinutes = recent.reduce((sum, ticket) => {
        const start = new Date(ticket.calledAt).getTime()
        const end = new Date(ticket.servedAt).getTime()
        const diffMins = Math.max(1, (end - start) / 60000)
        return sum + diffMins
    }, 0)

    return Math.max(1, Math.round((totalMinutes / recent.length) * 10) / 10)
}

/**
 * Calculate Dynamic Moving Average Wait Time for a ticket in queue
 * Formula: Estimated Wait = Math.ceil((People Ahead * Moving Avg Service Time) / Active Counters)
 */
export function calculateDynamicWaitTime({ ticket, queue = [], counters = [], completedTickets = [], fallbackDuration = 10 }) {
    if (!ticket) return 0
    if (['called', 'serving', 'served', 'noshow'].includes(ticket.status)) return 0

    const targetServiceId = typeof ticket.service === 'object' ? (ticket.service.id || ticket.service._id) : ticket.service

    // 1. Calculate Moving Average service time from recent served history
    const movingAvg = calculateServiceMovingAverage(completedTickets, targetServiceId, fallbackDuration)

    // 2. Count active counters assigned or serving this service
    const activeCounters = counters.filter((c) => {
        if (c.status !== 'active') return false
        if (!c.service) return true // counter handles general services
        const cServiceId = typeof c.service === 'object' ? (c.service.id || c.service._id) : c.service
        return cServiceId === targetServiceId
    })

    const numActiveCounters = Math.max(1, activeCounters.length)

    // 3. Count people ahead in waiting/checked_in state for this service
    const currentPos = ticket.position || 1
    const peopleAhead = queue.filter((t) => {
        if (!['waiting', 'checked_in'].includes(t.status)) return false
        const tServiceId = typeof t.service === 'object' ? (t.service.id || t.service._id) : t.service
        if (tServiceId !== targetServiceId) return false
        const tPos = t.position || 0
        return tPos < currentPos || (tPos === currentPos && t._id !== ticket._id)
    }).length

    // 4. Calculate dynamic wait
    const estimatedMinutes = Math.ceil((peopleAhead * movingAvg) / numActiveCounters)
    return Math.max(0, estimatedMinutes)
}
