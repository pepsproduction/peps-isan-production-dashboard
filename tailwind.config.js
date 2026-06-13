/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b0f',
        panel: '#15151d',
        panelSoft: '#1f2029',
        peps: '#ff7a00',
        gold: '#f5b642',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,122,0,0.18), 0 18px 70px rgba(0,0,0,0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
