"use client"
import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

export function useIdleTimeout(timeoutMinutes = 30) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const resetTimer = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        signOut({ callbackUrl: "/auth?reason=idle" })
      }, timeoutMinutes * 60 * 1000)
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(timer.current)
    }
  }, [timeoutMinutes])
}