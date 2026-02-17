import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { init as initEmulatorDetection } from './utils/emulatorDetection'

// Initialize emulator detection before React renders
// If emulator is detected, access will be blocked and React won't render
const isBlocked = initEmulatorDetection();

// Only render React app if access is not blocked
if (!isBlocked) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

