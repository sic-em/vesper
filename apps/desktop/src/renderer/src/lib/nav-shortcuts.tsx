import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { isMac } from '@renderer/lib/platform'

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return true
  if (t.isContentEditable) return true
  return false
}

export function NavShortcuts(): null {
  const router = useRouter()
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isTypingTarget(e.target)) return
      if (isMac && e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        if (e.key === '[') {
          e.preventDefault()
          router.history.back()
        } else if (e.key === ']') {
          e.preventDefault()
          router.history.forward()
        }
      } else if (!isMac && e.altKey && !e.metaKey && !e.shiftKey && !e.ctrlKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          router.history.back()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          router.history.forward()
        }
      }
    }

    const onMouse = (e: MouseEvent): void => {
      if (e.button === 3) {
        e.preventDefault()
        router.history.back()
      } else if (e.button === 4) {
        e.preventDefault()
        router.history.forward()
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onMouse)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onMouse)
    }
  }, [router])

  return null
}
