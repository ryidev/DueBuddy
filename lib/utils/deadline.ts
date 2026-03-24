import { differenceInHours, differenceInDays, isPast } from 'date-fns'

export function canDeleteTask(deadline: Date): boolean {
  const now = new Date()
  if (isPast(deadline)) {
    return false
  }
  const hoursUntilDeadline = differenceInHours(deadline, now)
  return hoursUntilDeadline >= 24
}

export function getDeadlineUrgency(deadline: Date): 'critical' | 'urgent' | 'normal' {
  const now = new Date()
  const hoursUntilDeadline = differenceInHours(deadline, now)

  if (isPast(deadline)) {
    return 'critical'
  } else if (hoursUntilDeadline < 24) {
    return 'critical'
  } else if (hoursUntilDeadline < 72) {
    return 'urgent'
  }
  return 'normal'
}

export function formatTimeRemaining(deadline: Date): string {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return 'Deadline passed'
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  }
  return 'Due now'
}

export function getUrgencyColor(urgency: 'critical' | 'urgent' | 'normal') {
  switch (urgency) {
    case 'critical':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    case 'urgent':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    case 'normal':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }
}
