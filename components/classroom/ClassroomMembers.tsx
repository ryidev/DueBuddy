'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  profiles: {
    email: string
    full_name: string | null
  }
  role: string
}

interface ClassroomMembersProps {
  classroomId: string
}

export function ClassroomMembers({ classroomId }: ClassroomMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [classroomId])

  const fetchMembers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('classroom_members')
        .select('role, profiles(email, full_name)')
        .eq('classroom_id', classroomId)

      if (error) throw error

      const formattedMembers = data?.map((m: any) => ({
        role: m.role,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      })) as Member[]

      setMembers(formattedMembers || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-text-muted">Loading members...</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-primary">
        Members ({members.length})
      </h3>
      <ul className="space-y-1">
        {members.map((member, index) => (
          <li
            key={index}
            className="flex items-center justify-between text-sm text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <div className="avatar-modern text-xs">
                {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <span>{member.profiles?.full_name || member.profiles?.email || 'Unknown Member'}</span>
            </div>
            {member.role === 'owner' && (
              <span className="text-xs font-medium bg-accent-blue/10 text-accent-blue px-2 py-1 rounded">
                Owner
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
