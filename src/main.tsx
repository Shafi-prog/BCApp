import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { initializeIcons } from '@fluentui/react/lib/Icons'
import { registerIcons } from '@fluentui/style-utilities'
import { initialize } from '@microsoft/power-apps/app'
import { initializePowerSDK, isPowerAppsEnvironment } from './services/powerSDKClient'
import App from './App'
import './styles.css'

// Initialize Fluent UI icons - MUST be called before any component renders
initializeIcons()

// Register custom icons that were causing warnings
registerIcons({
  icons: {
    'tasklist': (
      <svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">
        <path d="M1920 0q27 0 50 10t40 27 28 41 10 50v1792q0 27-10 50t-27 40-41 28-50 10H128q-27 0-50-10t-40-27-28-41-10-50V128q0-27 10-50t27-40T78 10t50-10h1792zM256 1792h1536V256H256v1536zm256-1024h1024v128H512V768zm0 384h1024v128H512v-128z"/>
      </svg>
    ),
    'school': (
      <svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">
        <path d="M1024 0l960 512v1536h-128V632l-832 443-960-512 960-563zm0 219L288 587l736 368 736-368-736-368zm-640 867v374q90 58 217 88t263 31q136 0 263-30t217-89v-374l-480 260-480-260zm480 770q-110 0-211-23t-186-66-148-102-96-130h1282q-38 74-96 129t-148 103-186 66-211 23z"/>
      </svg>
    ),
    'buildingmultiple': (
      <svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">
        <path d="M1792 0q27 0 50 10t40 27 28 41 10 50v1536h-128V128H896V0h896zM768 256q27 0 50 10t40 27 28 41 10 50v1536H768v-384H256v384H128V384q0-27 10-50t27-40 41-28 50-10h512zm-512 640V512h128v384H256zm256 0V512h128v384H512zm256 0V512h128v384H768zM256 1024v384h128v-384H256zm256 0v384h128v-384H512zm256 0v384h128v-384H768z"/>
      </svg>
    ),
  }
})

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
