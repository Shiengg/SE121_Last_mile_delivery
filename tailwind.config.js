module.exports = {
  // ... other config
  extend: {
    keyframes: {
      shake: {
        '0%, 100%': { transform: 'translateX(0)' },
        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
        '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
      }
    },
    animation: {
      shake: 'shake 0.8s cubic-bezier(.36,.07,.19,.97) both',
    }
  }
} 