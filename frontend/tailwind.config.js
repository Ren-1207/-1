/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          dark: '#232F3E',
          blue: '#1B6EC2',
        },
      },
    },
  },
  plugins: [],
};
