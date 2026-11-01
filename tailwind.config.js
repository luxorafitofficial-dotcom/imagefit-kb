/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F9',
          100: '#D9E3EF',
          600: '#234C82',
          700: '#1C3D69',
          800: '#18345A', // Primary Navy
          900: '#0F213A',
          DEFAULT: '#18345A',
        },
        surface: {
          light: '#F3F5F8', // Light Grey card background
          border: '#E3E8EF', // Border color
        },
        bodyText: '#344054',
        subText: '#667085',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

