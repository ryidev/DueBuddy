'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClassroomCard } from './ClassroomCard'

export function ClassroomList() {
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClassrooms()
  }, [])

  const loadClassrooms = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setLoading(true)
      setError(null)

      // Step 1: get memberships
      const { data: memberships } = await supabase
        .from('classroom_members')
        .select('role, classroom_id')
        .eq('profile_id', user.id)

      if (!memberships || memberships.length === 0) {
        setClassrooms([])
        setLoading(false)
        return
      }

      // Step 2: get classrooms by ID
      const classroomIds = memberships.map((m: any) => m.classroom_id)
      const { data: classroomData } = await supabase
        .from('classrooms')
        .select('*')
        .in('id', classroomIds)

      if (!classroomData) {
        setClassrooms([])
        setLoading(false)
        return
      }

      const roleMap = Object.fromEntries(memberships.map((m: any) => [m.classroom_id, m.role]))

      // Get member counts in parallel
      const withCounts = await Promise.all(
        classroomData.map(async (c: any) => {
          const { count } = await supabase
            .from('classroom_members')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', c.id)
          return { ...c, member_count: count || 0, role: roleMap[c.id] || 'member' }
        })
      )

      setClassrooms(withCounts)
    } catch (err) {
      console.error('Error loading classrooms:', err)
      setError('Failed to load classrooms')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="spinner-modern w-8 h-8 border-4" />
          <p className="text-text-muted text-sm">Loading your classrooms...</p>
        </div>
      ) : error ? (
        <div className="liquid-glass-static p-8 text-center rounded-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Something went wrong</h3>
          <p className="text-text-muted text-sm mb-4">{error}</p>
          <button onClick={loadClassrooms} className="btn-modern btn-primary-modern">
            Try Again
          </button>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="liquid-glass-static p-12 text-center rounded-2xl">
          <div className="text-5xl mb-4">🏫</div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Classrooms Yet</h3>
          <p className="text-text-muted text-sm">
            Get started by creating your first classroom or joining one with a code.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              id={classroom.id}
              name={classroom.name}
              uniqueCode={classroom.unique_code}
              memberCount={classroom.member_count}
              role={classroom.role}
            />
          ))}
        </div>
      )}
    </div>
  )
}
