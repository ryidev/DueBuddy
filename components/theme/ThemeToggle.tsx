'use client'

import { useTheme } from './ThemeProvider'
import { useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [bouncing, setBouncing] = useState(false)

  const handleToggle = () => {
    setBouncing(true)
    toggleTheme()
    setTimeout(() => setBouncing(false), 500)
  }

  return (
    <button
      onClick={handleToggle}
      className="relative w-12 h-12 rounded-xl liquid-glass-static flex items-center justify-center overflow-visible"
      style={{ border: '1px solid var(--glass-border)' }}
      aria-label="Toggle theme"
    >
      <span
        className="text-xl select-none"
        style={{
          display: 'inline-block',
          animation: bouncing ? 'bounce-icon 0.5s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
          willChange: 'transform',
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>

      <style>{`
        @keyframes bounce-icon {
          0%   { transform: translateY(0); }
          20%  { transform: translateY(-8px); }
          40%  { transform: translateY(2px); }
          60%  { transform: translateY(-5px); }
          80%  { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </button>
  )
}
