import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ToastContainer from '../ui/ToastContainer'

/**
 * AppLayout — wraps all authenticated pages with navbar + sidebar.
 */
export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:ml-56 lg:p-8">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
