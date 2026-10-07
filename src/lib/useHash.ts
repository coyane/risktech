import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'

function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify)
  window.addEventListener('popstate', notify)
  return () => {
    window.removeEventListener('hashchange', notify)
    window.removeEventListener('popstate', notify)
  }
}

// El fragmento actual de la URL. Cubre los enlaces del router y los enlaces
// normales dentro de la página (<a href="#...">).
export function useHash() {
  // El router avisa de sus propias navegaciones, que no disparan hashchange.
  const { key } = useLocation()
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return { hash, key }
}
