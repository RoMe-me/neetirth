import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/liquid.css'
import './styles/responsive.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)

// Cache the app shell after the first production visit so PYQs, practice and
// local progress remain usable during a network drop. AI stays online-only.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
