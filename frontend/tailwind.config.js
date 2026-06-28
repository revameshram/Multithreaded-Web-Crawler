/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1120',
        panel: '#131c31',
        panelSoft: '#17223b',
        accent: '#3dd9b3',
        accentAlt: '#7cc8ff',
        warn: '#f59e0b',
        danger: '#ef4444',
        textMain: '#e5eefb',
        textMuted: '#8fa2c7',
        line: '#223252',
      },
      boxShadow: {
        panel: '0 16px 40px rgba(3, 7, 18, 0.35)',
      },
      backgroundImage: {
        shell: 'radial-gradient(circle at top left, rgba(61, 217, 179, 0.14), transparent 30%), radial-gradient(circle at top right, rgba(124, 200, 255, 0.16), transparent 28%), linear-gradient(180deg, #08101f 0%, #0b1120 55%, #0c1527 100%)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
