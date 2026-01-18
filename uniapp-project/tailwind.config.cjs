/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,uvue}"],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
};
