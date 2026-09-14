export const getItem = <T>(key: string): T | undefined => {
  const data = window.localStorage.getItem(key)
  if (!data) return undefined
  try {
    return JSON.parse(data) as T
  } catch {
    return undefined
  }
}

export const setItem = (key: string, value: object | string | null) => {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  window.localStorage.setItem(key, value)
}

export const removeItem = (key: string) => {
  window.localStorage.removeItem(key)
}
