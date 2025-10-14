/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(220 25% 10%)',
        primary: 'hsl(280 100% 70%)',
        secondary: 'hsl(200 100% 60%)',
        accent: 'hsl(180 100% 50%)',
        card: 'hsl(220 20% 15% / 0.5)',
        border: 'hsl(220 20% 25%)',
        foreground: 'hsl(210 100% 98%)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, hsl(280 100% 70%), hsl(200 100% 60%))',
        'mesh-gradient': 'radial-gradient(circle at top left, hsl(280 100% 70% / 0.2) 0%, transparent 50%), radial-gradient(circle at top right, hsl(200 100% 60% / 0.2) 0%, transparent 50%), radial-gradient(circle at bottom left, hsl(180 100% 50% / 0.2) 0%, transparent 50%), radial-gradient(circle at bottom right, hsl(280 100% 70% / 0.2) 0%, transparent 50%)',
      },
      boxShadow: {
        'neon': '0 0 30px hsl(280 100% 70% / 0.5)',
        'glass': '0 8px 32px 0 hsl(0 0% 0% / 0.37)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'glow-pulse': 'glowPulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out infinite 1s',
        'bounce-dot-1': 'bounceDot 1.4s ease-in-out infinite',
        'bounce-dot-2': 'bounceDot 1.4s ease-in-out infinite 0.2s',
        'bounce-dot-3': 'bounceDot 1.4s ease-in-out infinite 0.4s',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px hsl(280 100% 70% / 0.5)'
          },
          '50%': { 
            boxShadow: '0 0 40px hsl(280 100% 70% / 0.8)'
          },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px)'
          },
          '50%': { 
            transform: 'translateY(-10px)'
          },
        },
        bounceDot: {
          '0%, 80%, 100%': { 
            transform: 'scale(0)',
            opacity: '0.5'
          },
          '40%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
      },
      borderRadius: {
        'modern': '1rem',
      },
    },
  },
  plugins: [],
}

