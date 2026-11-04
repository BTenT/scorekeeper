import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

// Navigation is plain view state, so the WebView has no history to go back through.
// Screens and dialogs register here in mount order; the last one mounted is on top.
const handlers: { current: () => void }[] = []

/** Android only: a listener replaces the default of closing the app, so the root screen exits itself. */
export function listenForBackButton() {
  if (Capacitor.getPlatform() !== 'android') return
  void App.addListener('backButton', () => {
    const top = handlers[handlers.length - 1]
    if (top) top.current()
    else void App.exitApp()
  })
}

export function useBackButton(onBack: () => void) {
  const latest = useRef(onBack)
  useEffect(() => {
    latest.current = onBack
  })
  useEffect(() => {
    handlers.push(latest)
    return () => {
      handlers.splice(handlers.indexOf(latest), 1)
    }
  }, [])
}
