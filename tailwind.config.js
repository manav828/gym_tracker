/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#3b82f6',
                    600: '#2563eb',
                },
                dark: {
                    bg: '#121212',
                    card: '#1e1e1e',
                    text: '#e5e5e5',
                    muted: '#a3a3a3'
                }
            }
        },
    },
    plugins: [],
}
