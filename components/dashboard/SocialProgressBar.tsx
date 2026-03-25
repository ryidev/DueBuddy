'use client'

interface SocialProgressBarProps {
  completedCount: number
  totalCount: number
  completedBy: Array<{ name: string }>
}

export function SocialProgressBar({
  completedCount,
  totalCount,
  completedBy,
}: SocialProgressBarProps) {
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const remaining = totalCount - completedCount

  return (
    <div className="space-y-3">
      

      {/* Progress Bar */}
      <div className="relative h-3 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Glow effect */}
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <svg className="w-4 h-4 text-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7m0 0l7-7m0 0l7 7m-7-7h4.5m0 0l4.5 4.5m0 0l-4.5-4.5m4.5 4.5H16m-7 0l-4 4m0 0l-4 4" />
          </svg>
          <span>
            {remaining} {remaining === 1 ? 'friend' : 'friends'} need to catch up!
          </span>
        </p>
      )}

      {remaining === 0 && (
        <p className="text-xs text-emerald-500 mt-2 font-semibold flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 0l-4 4m0 0l-4 4-4m6 0l-4 4m0 0l-4 4m-4 4h18m-7-7h18m-7-7h18m-7-7h18m-9-7h18m0 0l-9-9" />
          </svg>
          <span>All members completed!</span>
        </p>
      )}
    </div>
  )
}
