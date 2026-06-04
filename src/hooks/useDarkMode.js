import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('darkMode', dark)
  }, [dark])

  return [dark, setDark]
}
