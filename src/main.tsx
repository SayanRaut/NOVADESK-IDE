import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { initApiConfig } from './config/api'
import { initWebIdeApi } from './services/webIdeApi'

// Initialize Web IDE Platform Adapter
initWebIdeApi()

initApiConfig().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
