/**
 * QRCodeDisplay — renders a pure-SVG QR-like visual for a ticket.
 * We generate a deterministic grid from the ticket's qrCode string
 * so it looks unique without any external QR library.
 */
import { useMemo } from 'react'

function hashString(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(h)
}

function generateGrid(seed, size = 21) {
  const cells = []
  let n = hashString(seed)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Always fill the three finder patterns (corners)
      const inFinder =
        (row < 8 && col < 8) ||
        (row < 8 && col >= size - 8) ||
        (row >= size - 8 && col < 8)
      const inFinderInner =
        (row >= 2 && row <= 5 && col >= 2 && col <= 5) ||
        (row >= 2 && row <= 5 && col >= size - 6 && col <= size - 3) ||
        (row >= size - 6 && row <= size - 3 && col >= 2 && col <= 5)

      if (inFinder) {
        cells.push(inFinderInner ? 1 : row % 7 === 0 || col % 7 === 0 ? 1 : 0)
      } else {
        n ^= n << 13
        n ^= n >> 17
        n ^= n << 5
        cells.push(Math.abs(n) % 3 === 0 ? 1 : 0)
      }
    }
  }
  return cells
}

export default function QRCodeDisplay({
  value = 'TICKET',
  size = 160,
  ticketNumber = '',
  className = '',
}) {
  const GRID = 21
  const cells = useMemo(() => generateGrid(value, GRID), [value])
  const cellSize = size / GRID

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="bg-white border-2 border-slate-200 rounded-xl p-3"
        role="img"
        aria-label={`QR code for ticket ${ticketNumber}`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {cells.map((filled, i) => {
            if (!filled) return null
            const row = Math.floor(i / GRID)
            const col = i % GRID
            return (
              <rect
                key={i}
                x={col * cellSize + 0.5}
                y={row * cellSize + 0.5}
                width={cellSize - 1}
                height={cellSize - 1}
                rx={cellSize * 0.15}
                fill="#1e293b"
              />
            )
          })}
        </svg>
      </div>
      {ticketNumber && (
        <p className="text-xs font-mono text-slate-500 tracking-widest">
          {ticketNumber}
        </p>
      )}
    </div>
  )
}
