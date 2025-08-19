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
      colors: {
        ink: '#0a0a0a',
        mist: '#f6f6f6',
        line: '#e8e8e8',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
keyframes: {
  fadeUp: {
    '0%':   { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  fadeUp: 'fadeUp .6s ease-out both',
},
    },
  },
  plugins: [],
}
export default config