/**
 * Web Push Notification Service
 * Native Browser Push Notifications using the Notification API.
 */

export const isWebPushSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window
}

export const getWebPushPermission = () => {
  if (!isWebPushSupported()) return 'unsupported'
  return Notification.permission
}

export const requestWebPushPermission = async () => {
  if (!isWebPushSupported()) {
    console.warn('[PushNotification] Web Push is not supported in this browser.')
    return 'unsupported'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[PushNotification] Permission status:', permission)
    return permission
  } catch (err) {
    console.error('[PushNotification] Error requesting permission:', err)
    return 'denied'
  }
}

export const sendWebPushNotification = (title, options = {}) => {
  if (!isWebPushSupported() || Notification.permission !== 'granted') {
    console.log('[PushNotification] Cannot send notification - permission not granted.')
    return false
  }

  try {
    const defaultOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: options.tag || 'smartqueue-notif',
      ...options,
    }

    const notif = new Notification(title, defaultOptions)

    if (options.onClickUrl) {
      notif.onclick = () => {
        window.focus()
        window.location.href = options.onClickUrl
        notif.close()
      }
    }

    return notif
  } catch (err) {
    console.error('[PushNotification] Failed to display notification:', err)
    return false
  }
}
