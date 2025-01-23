import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupInIframe } from 'cross-iframe-rpc'

if (process.env.NODE_ENV === 'development') {
  window.chrome = setupInIframe<typeof chrome>()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
