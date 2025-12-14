/*!
 * Power Apps SDK for Code Apps
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

// Check if running in Power Apps environment
export const isPowerAppsEnvironment = (): boolean => {
  return (
    window.location.hostname.includes('powerapps.com') ||
    window.location.hostname.includes('azure-apihub.net') ||
    !window.location.hostname.includes('localhost')
  )
}

// Get context from Power Apps host
let contextPromise: Promise<any> | null = null

export const getContext = async (): Promise<any> => {
  if (contextPromise) return contextPromise
  
  try {
    // Try to get context from Power Apps host
    if ((window as any).Xrm?.Utility?.getGlobalContext) {
      const context = (window as any).Xrm.Utility.getGlobalContext()
      contextPromise = Promise.resolve(context)
      return contextPromise
    }
  } catch (e) {
    console.log('Power Apps context not available')
  }
  
  return Promise.resolve(null)
}

// Initialize Power Apps SDK
export const initialize = async (): Promise<void> => {
  console.log('[PowerApps SDK] Initializing...')
  
  try {
    // Signal ready to Power Platform host
    if ((window as any).PowerPlatform?.ready) {
      (window as any).PowerPlatform.ready()
      console.log('[PowerApps SDK] PowerPlatform.ready() called')
    }
    
    // Post message to parent frame
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ready' }, '*')
      window.parent.postMessage({ type: 'AppReady' }, '*')
      window.parent.postMessage('ready', '*')
      console.log('[PowerApps SDK] Ready messages posted to parent')
    }
    
    // Dispatch custom events
    window.dispatchEvent(new CustomEvent('appready'))
    document.dispatchEvent(new CustomEvent('appready'))
    
    // Also dispatch DOMContentLoaded-like event
    window.dispatchEvent(new Event('load'))
    
    console.log('[PowerApps SDK] Initialization complete')
  } catch (e) {
    console.error('[PowerApps SDK] Initialization error:', e)
  }
}

export default {
  initialize,
  getContext,
  isPowerAppsEnvironment,
}
