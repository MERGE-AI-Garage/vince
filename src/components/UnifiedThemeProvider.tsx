// ABOUTME: Light/dark theme provider with localStorage persistence.
// ABOUTME: Toggles .dark class on <html> and provides theme context to the app.

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"

type UnifiedTheme = "light" | "dark"

type SetThemeOptions = { skipPersist?: boolean }

type UnifiedThemeProviderState = {
  theme: UnifiedTheme
  setTheme: (theme: UnifiedTheme, options?: SetThemeOptions) => void
  resolvedTheme: UnifiedTheme
}

const initialState: UnifiedThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  resolvedTheme: "dark",
}

const UnifiedThemeContext = createContext<UnifiedThemeProviderState>(initialState)

export function UnifiedThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vince-theme",
}: {
  children: React.ReactNode
  defaultTheme?: UnifiedTheme
  storageKey?: string
}) {
  const [theme, setThemeState] = useState<UnifiedTheme>(
    () => (localStorage.getItem(storageKey) as UnifiedTheme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const handleSetTheme = useCallback((newTheme: UnifiedTheme, options?: SetThemeOptions) => {
    if (!options?.skipPersist) {
      localStorage.setItem(storageKey, newTheme)
    }
    setThemeState(newTheme)
  }, [storageKey])

  const value = useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    resolvedTheme: theme,
  }), [theme, handleSetTheme])

  return (
    <UnifiedThemeContext.Provider value={value}>
      {children}
    </UnifiedThemeContext.Provider>
  )
}

export const useUnifiedTheme = () => {
  const context = useContext(UnifiedThemeContext)
  if (context === undefined)
    throw new Error("useUnifiedTheme must be used within a UnifiedThemeProvider")
  return context
}
