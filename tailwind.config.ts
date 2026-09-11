import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Brand palette lives in src/styles/globals.css as space-separated RGB channels
 * so Tailwind's `/opacity` modifiers keep working (e.g. `bg-maroon-700/80`).
 *
 *   --maroon-900: #4A0A14   --gold-500: #C9A227   --cream-50: #FAF7F2
 *   --maroon-700: #7A1220   --gold-200: #E8D9A0   --ink-900:  #1A1A1A
 *   --maroon-500: #A31E30                         --ink-500:  #6B6B6B
 */
const channel = (name: string) => `rgb(var(${name}) / <alpha-value>)`

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        maroon: {
          900: channel('--maroon-900'),
          700: channel('--maroon-700'),
          500: channel('--maroon-500'),
        },
        gold: {
          500: channel('--gold-500'),
          200: channel('--gold-200'),
        },
        cream: { 50: channel('--cream-50') },
        ink: {
          900: channel('--ink-900'),
          500: channel('--ink-500'),
        },
        // Semantic aliases so shadcn-style primitives resolve against the brand.
        background: channel('--cream-50'),
        foreground: channel('--ink-900'),
        muted: channel('--ink-500'),
        border: channel('--hairline'),
        ring: channel('--gold-500'),
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(26 26 26 / 0.04), 0 8px 24px -12px rgb(26 26 26 / 0.14)',
        'card-hover': '0 2px 4px rgb(26 26 26 / 0.06), 0 16px 40px -16px rgb(74 10 20 / 0.28)',
        header: '0 1px 0 rgb(201 162 39 / 0.28), 0 8px 24px -16px rgb(26 26 26 / 0.35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [animate],
}

export default config
