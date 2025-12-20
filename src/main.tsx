import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { initializeIcons } from '@fluentui/font-icons-mdl2'
import { initialize } from '@microsoft/power-apps/app'
import { initializePowerSDK, isPowerAppsEnvironment } from './services/powerSDKClient'
import App from './App'
import './styles.css'

// Import deployment check utilities for console access
import { runDeploymentCheck, checkChoiceFieldsOnly } from './utils/deploymentCheck'

// Expose deployment check functions to browser console
if (typeof window !== 'undefined') {
  (window as any).runDeploymentCheck = runDeploymentCheck;
  (window as any).checkChoiceFieldsOnly = checkChoiceFieldsOnly;
  console.log('[App] 🔍 Deployment check available: runDeploymentCheck() or checkChoiceFieldsOnly()')
}

// Initialize Fluent UI icons with default Office CDN
// This matches the working production builds
initializeIcons()

// Initialize Power Apps SDK and custom PowerSDK Client
const initializeApp = async () => {
  try {
    // Initialize Power Apps SDK first
    await initialize()
    console.log('[App] Power Apps SDK initialized')
  } catch (err) {
    console.log('[App] Power Apps SDK init (expected in dev):', err)
  }
  
  // Initialize custom Power SDK client for SharePoint
  try {
    await initializePowerSDK()
    console.log('[App] PowerSDK Client initialized')
    console.log('[App] Environment:', isPowerAppsEnvironment() ? 'Power Apps' : 'Local Development')
  } catch (err) {
    console.log('[App] PowerSDK Client init error:', err)
  }
}

initializeApp()

// Render app immediately
const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
