export function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeSession(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Almacenamiento no disponible: la app sigue funcionando en memoria.
  }
}

export function removeSession(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Almacenamiento no disponible.
  }
}
