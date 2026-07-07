/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050505',
        panel: '#121212',
        panelSoft: '#1c1c1c',
        accent: '#ef4444',
        accentAlt: '#b91c1c',
        warn: '#d97706',
        danger: '#dc2626',
        textMain: '#f3f4f6',
        textMuted: '#9ca3af',
        line: '#371818',
      },
      boxShadow: {
        panel: '0 16px 40px rgba(0, 0, 0, 0.65)',
        glow: '0 0 15px rgba(229, 9, 20, 0.4)',
      },
      backgroundImage: {
        shell: 'radial-gradient(circle at top, rgba(229, 9, 20, 0.12), transparent 45%), linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
