'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskItem } from './TaskItem'

interface TaskCompletion {
  profile_id: string
  completed_at: string
  profiles: {
    email: string
    full_name: string | null
  }
}

interface Task {
  id: string
  title: string
  description?: string
  deadline: string
  task_completions: TaskCompletion[]
}

interface TaskListProps {
  classroomId: string
  classroomMembersCount: number
}

export function TaskList({ classroomId, classroomMembersCount }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [classroomId])

  const fetchTasks = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setCurrentUserId(user.id)

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

      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No tasks yet. Create your first task!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          classroomMembersCount={classroomMembersCount}
          currentUserId={currentUserId}
          onDelete={handleDeleteTask}
        />
      ))}
    </div>
  )
}
