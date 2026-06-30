import { useEffect, useState } from 'react'

const STORAGE_KEY = 'frp-dashboard-theme'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return stored === 'dark'
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return {
    isDark,
    toggleDarkMode: () => setIsDark((value) => !value),
  }
}
