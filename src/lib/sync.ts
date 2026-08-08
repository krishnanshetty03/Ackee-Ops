// Lightweight cross-tab sync so the Farmer / Staff / Driver views stay live
// in sync whether they're panels in one window or popped into separate tabs.
// No backend: BroadcastChannel is the transport, localStorage is the durable copy.

const CHANNEL_NAME = 'tallawah-ops-sync-v1'
const STORAGE_KEY = 'tallawah-ops-state-v1'

let channel: BroadcastChannel | null = null
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
} catch {
  channel = null
}

export function loadPersisted<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

let writeTimer: ReturnType<typeof setTimeout> | null = null
export function persistAndBroadcast(state: unknown, immediate = false) {
  const write = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full / unavailable — demo continues in-memory
    }
    try {
      channel?.postMessage(state)
    } catch {
      // ignore
    }
  }
  if (immediate) {
    if (writeTimer) clearTimeout(writeTimer)
    write()
    return
  }
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(write, 120)
}

export function subscribeRemote<T>(onRemote: (state: T) => void) {
  const handler = (ev: MessageEvent) => onRemote(ev.data as T)
  channel?.addEventListener('message', handler)

  const storageHandler = (ev: StorageEvent) => {
    if (ev.key !== STORAGE_KEY || !ev.newValue) return
    try {
      onRemote(JSON.parse(ev.newValue) as T)
    } catch {
      // ignore malformed payloads
    }
  }
  window.addEventListener('storage', storageHandler)

  return () => {
    channel?.removeEventListener('message', handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export function resetPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
