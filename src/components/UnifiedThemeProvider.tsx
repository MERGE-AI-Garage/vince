import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import { useActiveThemePreset } from '@/hooks/useThemePresets'
import { parseBoolean } from './theme-playground/utils/colorUtils'

type UnifiedTheme = "light" | "dark"

type UnifiedThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: UnifiedTheme
  storageKey?: string
}

type SetThemeOptions = { skipPersist?: boolean }

type UnifiedThemeProviderState = {
  theme: UnifiedTheme
  setTheme: (theme: UnifiedTheme, options?: SetThemeOptions) => void
  resolvedTheme: UnifiedTheme
}

const initialState: UnifiedThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  resolvedTheme: "light",
}

const UnifiedThemeContext = createContext<UnifiedThemeProviderState>(initialState)

export function UnifiedThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ai-garage-theme",
}: UnifiedThemeProviderProps) {
  const [theme, setTheme] = useState<UnifiedTheme>(
    () => (localStorage.getItem(storageKey) as UnifiedTheme) || defaultTheme
  )

  const { data: activeThemePreset, isLoading, isError} = useActiveThemePreset()

  // Log theme loading issues for debugging
  if (isError) {
    console.warn('[Theme] Failed to load active theme preset, using defaults')
  }

  // Apply cached theme immediately to prevent FOUC (Flash of Unstyled Content)
  // This eliminates the "navy blue flash" by applying the last-loaded theme instantly
  useEffect(() => {
    const cachedThemeData = localStorage.getItem('ai-garage-theme-cache');
    if (cachedThemeData && !activeThemePreset) {
      try {
        const cached = JSON.parse(cachedThemeData);
        // Apply cached theme immediately - this runs before the database query completes
        // The database query will still run and update if there are changes
        console.log('[Theme] Applying cached theme to prevent flash');
        const root = window.document.documentElement;

        // Apply cached theme variables
        if (cached.theme_data) {
          const themeData = cached.theme_data;
          const cachedTheme = cached.current_theme || theme;

          // Apply background/foreground based on cached theme mode
          const background = cachedTheme === 'dark' ? themeData.darkBackground : themeData.lightBackground;
          const foreground = cachedTheme === 'dark' ? themeData.darkForeground : themeData.lightForeground;

          root.style.setProperty('--background', hexToHslValues(background, 'background'));
          root.style.setProperty('--foreground', hexToHslValues(foreground, 'foreground'));
          root.style.setProperty('--primary', hexToHslValues(themeData.primaryColor, 'primaryColor'));
        }
      } catch (e) {
        console.warn('[Theme] Failed to parse cached theme:', e);
      }
    }
  }, []); // Only run once on mount

  // Helper to convert hex to HSL values for CSS variables
  const hexToHslValues = (hex: string, variableName?: string): string => {
    // Validate input and warn in development for debugging theme issues
    if (!hex || typeof hex !== 'string') {
      if (process.env.NODE_ENV === 'development' && variableName) {
        console.warn(`[Theme] Missing value for ${variableName}, using fallback`)
      }
      return '0 0% 0%'
    }

    if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Theme] Invalid hex color "${hex}"${variableName ? ` for ${variableName}` : ''}, using fallback`)
      }
      return '0 0% 0%'
    }

    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const resolvedTheme = theme

  useEffect(() => {
    performance.mark('theme-apply-start')
    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove("light", "dark")

    // Add the resolved theme class
    root.classList.add(resolvedTheme)

    // Apply active theme preset colors for both light and dark modes
    if (activeThemePreset) {
      const themeData = activeThemePreset.theme_data

      console.log(`[Theme] Applying ${activeThemePreset.display_name} theme in ${resolvedTheme} mode`)

      // Apply background and foreground based on current mode (light/dark)
      const background = resolvedTheme === 'dark' ? themeData.darkBackground : themeData.lightBackground
      const foreground = resolvedTheme === 'dark' ? themeData.darkForeground : themeData.lightForeground
      const cardBackground = resolvedTheme === 'dark'
        ? (themeData.darkCardBackground || themeData.darkBackground)
        : themeData.cardBackground

      root.style.setProperty('--background', hexToHslValues(background, 'background'))
      root.style.setProperty('--foreground', hexToHslValues(foreground, 'foreground'))

      // Apply all theme colors from active preset
      root.style.setProperty('--primary', hexToHslValues(themeData.primaryColor, 'primaryColor'))
      root.style.setProperty('--primary-foreground', '0 0% 100%')

      // Apply theme colors for both light and dark modes
      root.style.setProperty('--secondary', hexToHslValues(themeData.secondaryColor))
      root.style.setProperty('--border', hexToHslValues(themeData.borderColor))
      root.style.setProperty('--muted-foreground', hexToHslValues(themeData.mutedColor))

      // Navigation and link colors - applied in both modes for consistency
      root.style.setProperty('--nav-active', hexToHslValues(themeData.navActiveColor))
      root.style.setProperty('--nav-hover', hexToHslValues(themeData.navHoverColor))
      root.style.setProperty('--nav-border', hexToHslValues(themeData.navBorderColor))
      root.style.setProperty('--link', hexToHslValues(themeData.linkColor))
      root.style.setProperty('--link-hover', hexToHslValues(themeData.linkHoverColor))
      root.style.setProperty('--link-visited', hexToHslValues(themeData.linkVisitedColor))

      // Input border color with dark mode override
      if (resolvedTheme === 'dark' && themeData.darkInputColor) {
        root.style.setProperty('--input', hexToHslValues(themeData.darkInputColor))
      } else {
        root.style.setProperty('--input', hexToHslValues(themeData.inputColor))
      }

      // Input background color with dark mode override
      const inputBg = resolvedTheme === 'dark'
        ? (themeData.darkInputBackground || themeData.darkCardBackground)
        : (themeData.inputBackground || '#ffffff')
      root.style.setProperty('--input-bg', hexToHslValues(inputBg))

      // Card styling for both modes
      root.style.setProperty('--card-hover', hexToHslValues(themeData.cardHoverColor))
      root.style.setProperty('--card-active', hexToHslValues(themeData.cardActiveColor))
      root.style.setProperty('--card-border', hexToHslValues(themeData.cardBorderColor))

      // Tab styling for both modes
      root.style.setProperty('--tab-background', `hsl(${hexToHslValues(themeData.tabBackground)})`)
      root.style.setProperty('--tab-active-background', `hsl(${hexToHslValues(themeData.tabActiveBackground)})`)
      root.style.setProperty('--tab-text-color', `hsl(${hexToHslValues(themeData.tabTextColor)})`)
      root.style.setProperty('--tab-active-text-color', `hsl(${hexToHslValues(themeData.tabActiveTextColor)})`)
      root.style.setProperty('--tab-hover-background', `hsl(${hexToHslValues(themeData.tabHoverBackground)})`)
      root.style.setProperty('--tab-border-color', `hsl(${hexToHslValues(themeData.tabBorderColor)})`)

      root.style.setProperty('--secondary-foreground', '0 0% 100%')
      root.style.setProperty('--accent', hexToHslValues(themeData.accentColor))
      root.style.setProperty('--accent-foreground', hexToHslValues(foreground))
      root.style.setProperty('--card', hexToHslValues(cardBackground))
      root.style.setProperty('--card-foreground', hexToHslValues(foreground))
      root.style.setProperty('--ring', hexToHslValues(themeData.primaryColor))
      root.style.setProperty('--muted', hexToHslValues(cardBackground))
      root.style.setProperty('--popover', hexToHslValues(cardBackground))
      root.style.setProperty('--popover-foreground', hexToHslValues(foreground))

      // Status indicators with proper foregrounds
      root.style.setProperty('--success', hexToHslValues(themeData.successColor))
      root.style.setProperty('--success-foreground', '0 0% 100%')
      root.style.setProperty('--warning', hexToHslValues(themeData.warningColor))
      root.style.setProperty('--warning-foreground', '0 0% 0%')
      root.style.setProperty('--destructive', hexToHslValues(themeData.errorColor))
      root.style.setProperty('--destructive-foreground', '0 0% 100%')
      root.style.setProperty('--info', hexToHslValues(themeData.infoColor))
      root.style.setProperty('--info-foreground', '0 0% 100%')
      root.style.setProperty('--neutral', hexToHslValues(themeData.neutralColor || '#6B7280'))
      root.style.setProperty('--neutral-foreground', '0 0% 100%')

      // Badge variant colors (independently themeable from core palette)
      root.style.setProperty('--badge-default', hexToHslValues(themeData.badgeDefaultColor || themeData.primaryColor))
      root.style.setProperty('--badge-default-foreground', hexToHslValues(themeData.badgeDefaultForeground || '#FFFFFF'))
      root.style.setProperty('--badge-secondary', hexToHslValues(themeData.badgeSecondaryColor || cardBackground))
      root.style.setProperty('--badge-secondary-foreground', hexToHslValues(themeData.badgeSecondaryForeground || foreground))
      root.style.setProperty('--badge-outline-foreground', hexToHslValues(themeData.badgeOutlineForeground || foreground))

      // Chart colors for data visualization
      root.style.setProperty('--chart-1', hexToHslValues(themeData.chartColor1 || themeData.primaryColor))
      root.style.setProperty('--chart-2', hexToHslValues(themeData.chartColor2 || themeData.accentColor))
      root.style.setProperty('--chart-3', hexToHslValues(themeData.chartColor3 || themeData.successColor))
      root.style.setProperty('--chart-4', hexToHslValues(themeData.chartColor4 || themeData.infoColor))
      root.style.setProperty('--chart-5', hexToHslValues(themeData.chartColor5 || themeData.warningColor))

      // Header elements - use dark variants in dark mode with smart fallbacks
      const headerBackground = resolvedTheme === 'dark'
        ? (themeData.darkHeaderBackground || themeData.darkCardBackground || themeData.darkBackground)
        : (themeData.headerBackground || cardBackground)
      const headerForeground = resolvedTheme === 'dark'
        ? (themeData.darkHeaderForeground || themeData.darkForeground)
        : (themeData.headerForeground || foreground)
      const headerAccent = resolvedTheme === 'dark'
        ? (themeData.darkHeaderAccent || themeData.accentColor || '#636466')
        : (themeData.headerAccent || themeData.mutedColor || '#636466')

      root.style.setProperty('--header-background', hexToHslValues(headerBackground))
      root.style.setProperty('--header-foreground', hexToHslValues(headerForeground))
      root.style.setProperty('--header-accent', hexToHslValues(headerAccent))
      root.style.setProperty('--header-background-opacity', themeData.headerBackgroundOpacity?.toString() || '1')

      // Footer elements - fallback to secondary color if not set
      root.style.setProperty('--footer-background', hexToHslValues(themeData.footerBackground || themeData.secondaryColor))
      root.style.setProperty('--footer-foreground', hexToHslValues(themeData.footerForeground || '#FFFFFF'))
      root.style.setProperty('--footer-accent', hexToHslValues(themeData.footerAccent || themeData.accentColor))

      // Special elements - with sensible fallbacks
      root.style.setProperty('--navigation-background', hexToHslValues(themeData.navigationBackground || cardBackground))
      root.style.setProperty('--tooltip-background', hexToHslValues(themeData.tooltipBackground || '#333333'))

      // Sidebar colors (full sidebar theming support)
      root.style.setProperty('--sidebar', hexToHslValues(themeData.sidebarBackground))
      root.style.setProperty('--sidebar-background', hexToHslValues(themeData.sidebarBackground))
      root.style.setProperty('--sidebar-foreground', hexToHslValues(themeData.sidebarForeground || foreground))
      root.style.setProperty('--sidebar-primary', hexToHslValues(themeData.sidebarPrimary || themeData.primaryColor))
      root.style.setProperty('--sidebar-primary-foreground', hexToHslValues(themeData.sidebarPrimaryForeground || '#FFFFFF'))
      root.style.setProperty('--sidebar-accent', hexToHslValues(themeData.sidebarAccent || themeData.accentColor))
      root.style.setProperty('--sidebar-accent-foreground', hexToHslValues(themeData.sidebarAccentForeground || foreground))
      root.style.setProperty('--sidebar-border', hexToHslValues(themeData.sidebarBorder || themeData.borderColor))
      root.style.setProperty('--sidebar-ring', hexToHslValues(themeData.sidebarRing || themeData.primaryColor))

      // Advanced styling options (enterprise-grade customization)
      const borderRadius = Number(themeData.borderRadius) || 12
      const borderWidth = Number(themeData.borderWidth) ?? 1
      const shadowIntensity = Number(themeData.shadowIntensity) || 50
      const shadowBlur = Number(themeData.shadowBlur) ?? 10
      const shadowSpread = Number(themeData.shadowSpread) ?? 0
      const shadowOffsetX = Number(themeData.shadowOffsetX) ?? 0
      const shadowOffsetY = Number(themeData.shadowOffsetY) ?? 4
      const shadowColor = themeData.shadowColor || '#000000'
      const fontScale = Number(themeData.fontScale) || 100
      const enableAnimations = parseBoolean(themeData.enableAnimations)

      root.style.setProperty('--radius', `${borderRadius / 16}rem`)
      root.style.setProperty('--border-width', `${borderWidth}px`)
      root.style.setProperty('--shadow-intensity', String(shadowIntensity / 100))
      root.style.setProperty('--shadow-blur', `${shadowBlur}px`)
      root.style.setProperty('--shadow-spread', `${shadowSpread}px`)
      root.style.setProperty('--shadow-offset-x', `${shadowOffsetX}px`)
      root.style.setProperty('--shadow-offset-y', `${shadowOffsetY}px`)
      root.style.setProperty('--shadow-color', hexToHslValues(shadowColor))

      // Generate shadow CSS custom property using the configured values
      const shadowAlpha = shadowIntensity / 100
      root.style.setProperty('--shadow-sm', `${shadowOffsetX}px ${shadowOffsetY / 2}px ${shadowBlur / 2}px ${shadowSpread}px hsl(${hexToHslValues(shadowColor)} / ${shadowAlpha * 0.5})`)
      root.style.setProperty('--shadow-md', `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px hsl(${hexToHslValues(shadowColor)} / ${shadowAlpha})`)
      root.style.setProperty('--shadow-lg', `${shadowOffsetX * 1.5}px ${shadowOffsetY * 2}px ${shadowBlur * 1.5}px ${shadowSpread}px hsl(${hexToHslValues(shadowColor)} / ${shadowAlpha * 1.2})`)
      root.documentElement?.style.setProperty('font-size', `${fontScale}%`)

      // Enable/disable animations globally
      if (!enableAnimations) {
        root.style.setProperty('--animation-duration', '0s')
        root.style.setProperty('--transition-duration', '0s')
      } else {
        root.style.removeProperty('--animation-duration')
        root.style.removeProperty('--transition-duration')
      }

      // Custom gradients - use dedicated colors if set, otherwise fall back to brand colors
      // Hero gradient (homepage background) - this is the big visible gradient
      const gradientHeroStart = themeData.gradientHeroStart || themeData.secondaryColor
      const gradientHeroMiddle = themeData.gradientHeroMiddle || themeData.primaryColor
      const gradientHeroEnd = themeData.gradientHeroEnd || themeData.successColor
      const gradientPrimaryStart = themeData.gradientPrimaryStart || themeData.primaryColor
      const gradientPrimaryEnd = themeData.gradientPrimaryEnd || themeData.successColor
      const gradientBoldStart = themeData.gradientBoldStart || themeData.secondaryColor
      const gradientBoldMiddle = themeData.gradientBoldMiddle || themeData.primaryColor
      const gradientBoldEnd = themeData.gradientBoldEnd || themeData.successColor
      const gradientAccentStart = themeData.gradientAccentStart || themeData.accentColor
      const gradientAccentEnd = themeData.gradientAccentEnd || themeData.primaryColor

      // Get gradient angles from theme data (default to 135deg)
      const gradientHeroAngle = themeData.gradientHeroAngle || '135'
      const gradientPrimaryAngle = themeData.gradientPrimaryAngle || '135'
      const gradientBoldAngle = themeData.gradientBoldAngle || '135'
      const gradientAccentAngle = themeData.gradientAccentAngle || '135'

      // Hero gradient - the main homepage background gradient
      root.style.setProperty('--gradient-hero', `linear-gradient(${gradientHeroAngle}deg, hsl(${hexToHslValues(gradientHeroStart)}), hsl(${hexToHslValues(gradientHeroMiddle)}), hsl(${hexToHslValues(gradientHeroEnd)}))`)
      root.style.setProperty('--gradient-hero-dark', `linear-gradient(to bottom right, hsl(${hexToHslValues(gradientHeroStart)}), hsl(${hexToHslValues(gradientHeroStart)} / 0.8))`)
      root.style.setProperty('--gradient-primary', `linear-gradient(${gradientPrimaryAngle}deg, hsl(${hexToHslValues(gradientPrimaryStart)}), hsl(${hexToHslValues(gradientPrimaryEnd)}))`)
      root.style.setProperty('--gradient-brand', `linear-gradient(${gradientPrimaryAngle}deg, hsl(${hexToHslValues(gradientPrimaryStart)} / 0.9), hsl(${hexToHslValues(gradientPrimaryEnd)}))`)
      root.style.setProperty('--gradient-bold', `linear-gradient(${gradientBoldAngle}deg, hsl(${hexToHslValues(gradientBoldStart)}), hsl(${hexToHslValues(gradientBoldMiddle)} / 0.8), hsl(${hexToHslValues(gradientBoldEnd)}))`)
      root.style.setProperty('--gradient-accent', `linear-gradient(${gradientAccentAngle}deg, hsl(${hexToHslValues(gradientAccentStart)}), hsl(${hexToHslValues(gradientAccentEnd)}))`)

      // Cache theme to localStorage to prevent FOUC on next page load
      try {
        localStorage.setItem('ai-garage-theme-cache', JSON.stringify({
          theme_data: activeThemePreset.theme_data,
          current_theme: resolvedTheme,
          display_name: activeThemePreset.display_name,
          cached_at: Date.now()
        }));
        console.log('[Theme] Cached theme for next load:', activeThemePreset.display_name);
      } catch (e) {
        console.warn('[Theme] Failed to cache theme:', e);
      }

      // Measure performance
      performance.mark('theme-apply-end')
      performance.measure('theme-application', 'theme-apply-start', 'theme-apply-end')
      const measure = performance.getEntriesByName('theme-application')[0]
      if (measure) {
        console.log(`[Theme Performance] CSS variables applied in ${measure.duration.toFixed(2)}ms`)
      }
    }
  }, [theme, activeThemePreset, resolvedTheme])


  // Memoize setTheme callback to prevent unnecessary re-renders
  const handleSetTheme = useCallback((newTheme: UnifiedTheme, options?: SetThemeOptions) => {
    if (!options?.skipPersist) {
      localStorage.setItem(storageKey, newTheme)
    }
    setTheme(newTheme)
  }, [storageKey])

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    resolvedTheme,
  }), [theme, handleSetTheme, resolvedTheme])

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