'use client'

import { useEffect, useState } from 'react'
import { getDeadlineUrgency, formatTimeRemaining } from '@/lib/utils/deadline'

interface CountdownTimerProps {
  deadline: Date
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>(formatTimeRemaining(deadline))

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(deadline))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [deadline])

  const urgency = getDeadlineUrgency(deadline)

  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-600 text-white shadow-lg shadow-red-500/30'
      case 'urgent':
        return 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
      case 'normal':
        return 'bg-green-500 text-white shadow-lg shadow-green-500/30'
      default:
        return 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
    }
  }

  return (
    <div className={`px-4 py-2 rounded-xl text-sm font-bold ${getUrgencyStyles()} transition-all duration-300`}>
      {timeRemaining}
    </div>
  )
}
