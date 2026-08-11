import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'

/**
 * QRCodeDisplay — renders a standard, ISO-compliant scannable QR code.
 * Formats values into valid web URLs so mobile phone cameras can scan
 * and open tracking pages directly without connection errors.
 */
export default function QRCodeDisplay({
  value = 'TICKET',
  size = 160,
  ticketNumber = '',
  className = '',
}) {
  const [qrSrc, setQrSrc] = useState('')

  // Construct a valid URL for mobile phone camera scanning
  const scanUrl = useMemo(() => {
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      return value
    }
    const ticketId = ticketNumber || value
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://smartqueue.app'
    return `${origin}/track?ticket=${encodeURIComponent(ticketId)}`
  }, [value, ticketNumber])

  useEffect(() => {
    let active = true

    QRCode.toDataURL(scanUrl, {
      width: size * 2, // High resolution for crisp rendering
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrSrc(url)
      })
      .catch((err) => {
        console.error('[QRCodeDisplay] Error generating QR code:', err)
      })

    return () => {
      active = false
    }
  }, [scanUrl, size])

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-center min-w-[120px] min-h-[120px]"
        role="img"
        aria-label={`Scannable QR code for ticket ${ticketNumber}`}
      >
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`QR Code for ${ticketNumber}`}
            style={{ width: size, height: size }}
            className="block"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg animate-pulse"
          >
            Generating QR...
          </div>
        )}
      </div>
      {ticketNumber && (
        <p className="text-xs font-mono font-bold text-slate-600 tracking-widest">{ticketNumber}</p>
      )}
    </div>
  )
}