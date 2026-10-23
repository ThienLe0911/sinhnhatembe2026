import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { syncReducedMotionAttribute } from './lib/reduced-motion'
import { MotionProvider } from './ui/MotionProvider'
import './ui/tokens.css'
import './ui/base.css'

syncReducedMotionAttribute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
)
