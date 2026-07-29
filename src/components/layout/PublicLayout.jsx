import Navbar from './Navbar'
import ToastContainer from '../ui/ToastContainer'

/**
 * PublicLayout — wraps public pages (landing, login, register) with a clean navbar.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ToastContainer />
    </div>
  )
}
