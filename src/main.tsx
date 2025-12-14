import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { initializeIcons } from '@fluentui/react/lib/Icons'
import { initialize } from '@microsoft/power-apps/app'
import App from './App'
import './styles.css'

// Initialize Fluent UI icons - MUST be called before any component renders
initializeIcons()

// Initialize Power Apps SDK first
initialize().then(() => {
  console.log('Power Apps SDK initialized')
}).catch((err) => {
  console.log('Power Apps SDK init error (expected in dev):', err)
})

// Render app immediately
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
