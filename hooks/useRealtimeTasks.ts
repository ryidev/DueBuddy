'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface TaskCompletion {
  profile_id: string
  completed_at: string
  profiles: {
    email: string
    full_name: string | null
  }
}

export interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  created_by: string
  task_completions: TaskCompletion[]
}

export function useRealtimeTasks(classroomId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_completions (
            profile_id,
            completed_at,
            profiles (
              email,
              full_name
            )
          )
        `)
        .eq('classroom_id', classroomId)
        .order('deadline', { ascending: true })

      if (!error && data) {
        setTasks(data as Task[])
      }
      setLoading(false)
    }

    fetchTasks()

    const tasksChannel = supabase
      .channel(`tasks:${classroomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task])
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(task =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev =>
              prev.filter(task => task.id !== payload.old.id)
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions',
        },
        () => {
          // Refresh tasks when completions change
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
    }
  }, [classroomId])

  return { tasks, loading }
}
