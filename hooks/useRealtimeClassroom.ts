'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeClassroom(classroomId: string) {
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchMemberCount = async () => {
      const { count } = await supabase
        .from('classroom_members')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)

      if (count !== null) {
        setMemberCount(count)
      }
      setLoading(false)
    }

    fetchMemberCount()

    const channel = supabase
      .channel(`classroom-members:${classroomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classroom_members',
          filter: `classroom_id=eq.${classroomId}`,
        },
        () => {
          fetchMemberCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [classroomId])

  return { memberCount, loading }
}
