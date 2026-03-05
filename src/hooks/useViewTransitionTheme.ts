// ABOUTME: Shared hook for theme toggling with a page-wide circular view-transition animation.
// ABOUTME: Expands a clipPath circle from the trigger element to reveal the new theme.

import { useCallback, type RefObject } from "react"
import { flushSync } from "react-dom"
import { useUnifiedTheme } from "@/components/UnifiedThemeProvider"

export function useViewTransitionTheme(
  elementRef: RefObject<HTMLElement | null>,
  duration = 400
) {
  const { theme, setTheme } = useUnifiedTheme()
  const isDark = theme === "dark"

  const toggleTheme = useCallback(async () => {
    if (!elementRef.current) return

    const newTheme = isDark ? "light" : "dark"

    // Fallback for browsers without view transition support
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    }).ready

    const { top, left, width, height } =
      elementRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [isDark, duration, setTheme, elementRef])

  return { isDark, toggleTheme }
}
