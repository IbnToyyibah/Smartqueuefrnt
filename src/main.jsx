import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { QueueProvider } from './context/QueueContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueueProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </QueueProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
