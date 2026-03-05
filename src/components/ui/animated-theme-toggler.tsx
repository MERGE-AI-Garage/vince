// ABOUTME: Compact theme toggle button with Sun/Moon icons.
// ABOUTME: Triggers the page-wide circular view-transition animation via shared hook.

"use client"
import { useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useViewTransitionTheme } from "@/hooks/useViewTransitionTheme"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  iconClassName?: string
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  iconClassName,
  ...props
}: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { isDark, toggleTheme } = useViewTransitionTheme(buttonRef, duration)

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "hover:bg-[hsl(var(--primary))]/10 p-2 rounded-md transition-colors",
        className
      )}
      {...props}
    >
      {isDark ? (
        <Sun className={cn("h-4 w-4 text-[hsl(var(--header-foreground))] hover:text-[hsl(var(--nav-active))]", iconClassName)} />
      ) : (
        <Moon className={cn("h-4 w-4 text-[hsl(var(--header-foreground))] hover:text-[hsl(var(--nav-active))]", iconClassName)} />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
