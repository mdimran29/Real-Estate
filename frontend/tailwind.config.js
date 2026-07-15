/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070d',
          900: '#0a0e1a',
          850: '#0d1220',
          800: '#111827',
          700: '#1a2236',
          600: '#242e45',
          500: '#374357',
        },
        brand: {
          50: '#eef4ff',
          100: '#dae7ff',
          200: '#bcd2ff',
          300: '#8fb3ff',
          400: '#5c8bff',
          500: '#3b63f8',
          600: '#2a45ec',
          700: '#2334ce',
          800: '#212ea6',
          900: '#212c83',
        },
        accent: {
          300: '#6ee7d8',
          400: '#3ddfc9',
          500: '#1fc7ae',
          600: '#12a390',
        },
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(91,139,255,0.15), 0 8px 30px -8px rgba(59,99,248,0.45)',
        'glow-accent': '0 0 0 1px rgba(61,223,201,0.15), 0 8px 30px -8px rgba(31,199,174,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.55)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -16px rgba(0,0,0,0.65)',
      },
      backgroundImage: {
        'grid-fade': 'linear-gradient(to bottom, transparent, rgba(5,7,13,0.9)), radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,99,248,0.25), transparent)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        fadeIn: 'fadeIn 0.4s ease-out forwards',
        scaleIn: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        slideDown: 'slideDown 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 6s ease-in-out infinite',
        glowPulse: 'glowPulse 2.4s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}
