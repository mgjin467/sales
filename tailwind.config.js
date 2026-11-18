/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'ink-1': '#171717',
        'ink-2': '#404040',
        'ink-3': '#525252',
        'ink-4': '#737373',
        line: '#e5e5e5',
        brand: '#c2410c',
        'brand-deep': '#9a3412',
        'brand-soft': '#fff7ed',
        surface: '#fafafa',
        'surface-hover': '#eef0f2',
        canvas: '#f2f2f4',
        danger: '#b91c1c',
        'danger-soft': '#fef2f2',
        ok: '#15803d',
        'ok-soft': '#f0fdf4',
        info: '#1d4ed8',
        'info-soft': '#eff6ff',
        'row-alt': '#fafaf9',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      fontSize: {
        body: ['15px', '1.5'],
        sub: ['14px', '1.5'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04),0 6px 20px rgba(0,0,0,.05)',
      },
    },
  },
  plugins: [],
};
