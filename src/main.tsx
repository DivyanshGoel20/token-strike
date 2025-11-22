import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Web3Providers } from './providers/Web3Providers.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Providers>
      <App />
    </Web3Providers>
  </StrictMode>,
)
