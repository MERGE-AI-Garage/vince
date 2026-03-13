// ABOUTME: Tailwind configuration for the Vince mobile app
// ABOUTME: Points content paths to the parent app's src directory for class scanning

import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"../src/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./index.html",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'fraunces': ['Inter', 'system-ui', 'sans-serif'],
				'epilogue': ['Epilogue', 'sans-serif'],
				'product-sans': ['Product Sans', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				'input-bg': 'hsl(var(--input-bg))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-hero': 'var(--gradient-hero)',
			},
			boxShadow: {
				'none': 'none',
				'sm': '0 1px calc(2px * var(--shadow-intensity, 1)) 0 rgba(0, 0, 0, calc(0.05 * var(--shadow-intensity, 1)))',
				'DEFAULT': '0 1px calc(3px * var(--shadow-intensity, 1)) 0 rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1))), 0 1px calc(2px * var(--shadow-intensity, 1)) -1px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1)))',
				'md': '0 4px calc(6px * var(--shadow-intensity, 1)) -1px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1))), 0 2px calc(4px * var(--shadow-intensity, 1)) -2px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1)))',
				'lg': '0 10px calc(15px * var(--shadow-intensity, 1)) -3px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1))), 0 4px calc(6px * var(--shadow-intensity, 1)) -4px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1)))',
				'xl': '0 20px calc(25px * var(--shadow-intensity, 1)) -5px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1))), 0 8px calc(10px * var(--shadow-intensity, 1)) -6px rgba(0, 0, 0, calc(0.1 * var(--shadow-intensity, 1)))',
				'2xl': '0 25px calc(50px * var(--shadow-intensity, 1)) -12px rgba(0, 0, 0, calc(0.25 * var(--shadow-intensity, 1)))',
				'inner': 'inset 0 2px calc(4px * var(--shadow-intensity, 1)) 0 rgba(0, 0, 0, calc(0.05 * var(--shadow-intensity, 1)))',
				'glow': 'var(--shadow-glow)',
				'card': 'var(--shadow-card)',
			},
			borderRadius: {
				'none': '0',
				'sm': 'calc(var(--radius) * 0.5)',
				'DEFAULT': 'var(--radius)',
				'md': 'calc(var(--radius) * 0.75)',
				'lg': 'var(--radius)',
				'xl': 'calc(var(--radius) * 1.5)',
				'2xl': 'calc(var(--radius) * 2)',
				'3xl': 'calc(var(--radius) * 3)',
				'full': '9999px',
			},
			borderWidth: {
				DEFAULT: 'var(--border-width)',
				'0': '0px',
				'2': '2px',
				'4': '4px',
				'8': '8px',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'shimmer-slide': {
					to: { transform: 'translateX(calc(100cqw - 100%))' }
				},
				'shine': {
					'0%': { backgroundPosition: '300% 300%' },
					'100%': { backgroundPosition: '0% 0%' }
				},
				'shine-pulse': {
					'0%': { backgroundPosition: '0% 0%' },
					'50%': { backgroundPosition: '100% 100%' },
					'100%': { backgroundPosition: '0% 0%' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
				'shine': 'shine var(--duration) infinite linear',
				'shine-pulse': 'shine-pulse var(--duration) infinite linear',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
