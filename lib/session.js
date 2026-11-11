const PREFIX = 'nobelium:v1:'

export function readSession (key) {
  try { return JSON.parse(window.sessionStorage.getItem(PREFIX + key)) } catch { return null }
}

export function writeSession (key, value) {
  try { window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* Storage can be unavailable in private browsing. */ }
}
