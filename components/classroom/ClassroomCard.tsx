'use client'

import Link from 'next/link'

interface ClassroomCardProps {
  id: string
  name: string
  uniqueCode: string
  memberCount: number
  role: string
}

export function ClassroomCard({ id, name, uniqueCode, memberCount, role }: ClassroomCardProps) {
  return (
    <Link href={`/classroom/${id}`} className="group block">
      <div className="liquid-glass-card p-6 h-full">
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary group-hover:text-gradient transition-colors pr-2 line-clamp-2">
              {name}
            </h3>
            {role === 'owner' && (
              <span className="badge-warning flex-shrink-0 ml-2">👑</span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <span>👥</span>
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">🔑</span>
              <span
                className="font-mono text-sm font-bold px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--accent-purple)' }}
              >
                {uniqueCode}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="w-full py-2.5 text-sm font-semibold text-center rounded-xl transition-all duration-200 group-hover:scale-[1.02]"
            style={{ background: 'var(--gradient-primary)', color: '#fff', boxShadow: 'var(--glow-subtle)' }}
          >
            Open Classroom →
          </div>
        </div>
      </div>
    </Link>
  )
}
