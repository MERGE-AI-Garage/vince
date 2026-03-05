// ABOUTME: Pill-shaped SVG theme toggle with sun/moon, clouds/stars, and bouncy animations.
// ABOUTME: Triggers the page-wide circular view-transition animation via shared hook.

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { useViewTransitionTheme } from "@/hooks/useViewTransitionTheme"
import "./scenic-theme-toggler.css"

interface ScenicThemeTogglerProps {
  width?: number
  className?: string
}

export const ScenicThemeToggler = ({
  width = 96,
  className,
}: ScenicThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { isDark, toggleTheme } = useViewTransitionTheme(buttonRef)

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn("scenic-toggle", className)}
      aria-label="Toggle theme"
      {...(isDark ? { "data-dark": "" } : {})}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <svg
        width={width}
        height={width / 2}
        viewBox="0 0 180 90"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* 4-Point Star Path */}
          <g id="scenic-star-path">
            <path
              d="M 0,-5 Q 0,0 5,0 Q 0,0 0,5 Q 0,0 -5,0 Q 0,0 0,-5 Z"
              fill="#ffffff"
            />
          </g>

          {/* Moon Mask to create the crescent */}
          <mask id="scenic-moon-mask">
            <rect x="-50" y="-50" width="200" height="200" fill="white" />
            <circle cx="37" cy="40" r="17" fill="black" />
          </mask>

          {/* Glow filter for the moon */}
          <filter
            id="scenic-moon-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pill Background */}
        <rect
          className="toggle-pill"
          x="5"
          y="5"
          width="170"
          height="80"
          rx="40"
        />

        {/* Light Mode Decorations (Clouds) */}
        <g className="clouds-group" fill="#ffffff" opacity="0.95">
          <circle cx="120" cy="50" r="12" />
          <circle cx="136" cy="40" r="16" />
          <circle cx="152" cy="50" r="12" />
          <rect x="120" y="46" width="32" height="16" />
        </g>

        {/* Dark Mode Decorations (Stars) */}
        <g className="stars-group">
          <use
            href="#scenic-star-path"
            x="40"
            y="30"
            className="star star-1"
            transform="scale(1.2)"
          />
          <use
            href="#scenic-star-path"
            x="65"
            y="25"
            className="star star-2"
            transform="scale(0.8)"
          />
          <use
            href="#scenic-star-path"
            x="55"
            y="55"
            className="star star-3"
            transform="scale(1)"
          />
          <use
            href="#scenic-star-path"
            x="30"
            y="60"
            className="star star-4"
            transform="scale(0.6)"
          />
          {/* Tiny dot stars */}
          <circle
            cx="75"
            cy="45"
            r="1.5"
            fill="#ffffff"
            opacity="0.6"
            className="star star-1"
          />
          <circle
            cx="25"
            cy="40"
            r="1"
            fill="#ffffff"
            opacity="0.4"
            className="star star-2"
          />
          <circle
            cx="80"
            cy="65"
            r="2"
            fill="#ffffff"
            opacity="0.5"
            className="star star-3"
          />
        </g>

        {/* The Slider Knob */}
        <g className="slider-group">
          {/* Light Mode Knob (Sun) */}
          <g className="sun-group">
            <circle cx="45" cy="45" r="18" fill="#FFD43B" />
            <g
              className="sun-rays"
              stroke="#FFD43B"
              strokeWidth="4.5"
              strokeLinecap="round"
            >
              <line x1="45" y1="12" x2="45" y2="18" />
              <line x1="45" y1="78" x2="45" y2="72" />
              <line x1="12" y1="45" x2="18" y2="45" />
              <line x1="78" y1="45" x2="72" y2="45" />
              <line x1="21.5" y1="21.5" x2="26" y2="26" />
              <line x1="68.5" y1="68.5" x2="64" y2="64" />
              <line x1="21.5" y1="68.5" x2="26" y2="64" />
              <line x1="68.5" y1="21.5" x2="64" y2="26" />
            </g>
          </g>

          {/* Dark Mode Knob (Moon) */}
          <g className="moon-group">
            <circle
              cx="45"
              cy="45"
              r="18"
              fill="#60A5FA"
              opacity="0.4"
              filter="url(#scenic-moon-glow)"
            />
            <circle
              cx="45"
              cy="45"
              r="21"
              fill="#ffffff"
              mask="url(#scenic-moon-mask)"
            />
          </g>
        </g>
      </svg>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
