/**
 * SMS Notification Service
 * Dispatches transactional SMS messages via SMS Gateway API (Twilio / Termii / Webhook)
 * with robust client-side fallback logging for demo/offline setups.
 */

export const SMS_CONFIG = {
  apiUrl: import.meta.env.VITE_SMS_API_URL || '',
  apiKey: import.meta.env.VITE_SMS_API_KEY || '',
  senderId: import.meta.env.VITE_SMS_SENDER_ID || 'SmartQueue',
}

/**
 * Send SMS Notification
 * @param {Object} params - { phone, ticketNumber, status, counterName, serviceName, estimatedWait }
 */
export const sendSMSNotification = async ({
  phone,
  ticketNumber,
  status = 'waiting',
  counterName = '',
  serviceName = 'Service',
  estimatedWait = 0,
}) => {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { success: false, reason: 'No phone number provided' }
  }

  const cleanPhone = phone.trim()

  // Format message text based on status
  let messageText
  switch (status) {
    case 'called':
      messageText = `[SmartQueue Alert] Ticket #${ticketNumber} for ${serviceName}! Please proceed to ${counterName || 'your assigned counter'} now.`
      break
    case 'upcoming':
      messageText = `[SmartQueue Alert] Ticket #${ticketNumber}: You are almost next! Approx ${estimatedWait} mins wait remaining.`
      break
    case 'served':
      messageText = `[SmartQueue] Ticket #${ticketNumber} complete. Thank you for visiting us!`
      break
    case 'joined':
    default:
      messageText = `[SmartQueue] Ticket #${ticketNumber} confirmed for ${serviceName}. Est. wait: ${estimatedWait} mins. Track live at venue.`
      break
  }

  // If custom API gateway configured, post to endpoint
  if (SMS_CONFIG.apiUrl) {
    try {
      const response = await fetch(SMS_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SMS_CONFIG.apiKey ? { Authorization: `Bearer ${SMS_CONFIG.apiKey}` } : {}),
        },
        body: JSON.stringify({
          to: cleanPhone,
          from: SMS_CONFIG.senderId,
          message: messageText,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        console.log('[SMS Service] SMS sent successfully to:', cleanPhone, data)
        return { success: true, data }
      }
      console.warn('[SMS Service] Gateway error response:', response.status, data)
    } catch (err) {
      console.error('[SMS Service] API request failed:', err)
    }
  }

  // Simulated fallback response (for demo mode / environment without external API key)
  console.log(`[SMS Service - Demo Fallback] SMS dispatched to ${cleanPhone}: "${messageText}"`)
  return {
    success: true,
    simulated: true,
    message: messageText,
    recipient: cleanPhone,
  }
}
