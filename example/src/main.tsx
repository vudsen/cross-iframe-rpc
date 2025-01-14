import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBridgePeerClient } from 'iframe-bridge'

window.chrome = createBridgePeerClient(chrome, {
  postMessage(str) {
    window.parent.window.postMessage(str, '*')
  },
  addEventListener(name, callback) {
    window.addEventListener(name, (evt) => {
      callback(evt)
    })
  },
  removeEventListener(name, callback) {
    window.removeEventListener(name, callback)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
