// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        serif: ['var(--font-serif)', 'Georgia'],
      },

      // Palette "accent" déclinée autour de #a3d9ff
      colors: {
        ink:  '#0a0a0a',
        mist: '#f6f6f6',
        line: '#e8e8e8',

        accent: {
          50:  '#f2faff',
          100: '#e4f4ff',
          200: '#c9e9ff',
          300: '#a3d9ff', // teinte principale actuelle
          400: '#7ec7ff',
          500: '#56b2ff',
          600: '#3898e6',
          700: '#2b78b4',
          800: '#245f8f',
          900: '#1f4e75',
          DEFAULT: '#a3d9ff',
        },
      },

      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },

      // Animations douces
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.85', transform: 'scale(.98)' },
        },
        underlineIn: {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .6s ease-out both',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        underlineIn: 'underlineIn .25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config