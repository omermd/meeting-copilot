import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                google: ['"Google Sans"', '"Product Sans"', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#ced9fd',
                    300: '#adc0fc',
                    400: '#8da7fa',
                    500: '#6d8efa',
                    600: '#5a75cf',
                    700: '#485ea5',
                    800: '#36467c',
                    900: '#242f52',
                    950: '#121720',
                },
            },
        },
    },
    plugins: [],
};
export default config;
