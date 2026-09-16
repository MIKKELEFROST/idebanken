import { useCallback, useEffect, useRef, useState } from 'react'

export type Toast = { text: string; tone: 'ok' | 'error' } | null

export function useToast() {
  const [toast, setToast] = useState<Toast>(null)
  const timer = useRef<number | undefined>(undefined)

  const flash = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    window.clearTimeout(timer.current)
    setToast({ text, tone })
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { toast, flash }
}
