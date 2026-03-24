'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CountdownTimer } from './CountdownTimer'
import { SocialProgressBar } from './SocialProgressBar'
import { getIcon } from '@/components/ui/Icons'

interface TaskCompletion {
  profile_id: string
  completed_at: string
  profiles: {
    email: string
    full_name: string | null
  }
}

interface TaskItemProps {
  task: {
    id: string
    title: string
    description?: string
    deadline: string
    task_completions: TaskCompletion[]
  }
  classroomMembersCount: number
  currentUserId: string | undefined
  onDelete: (id: string) => void
}

export function TaskItem({
  task,
  classroomMembersCount,
  currentUserId,
  onDelete,
}: TaskItemProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(
    task.task_completions.some(c => c.profile_id === currentUserId)
  )

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
      })
      if (response.ok) {
        setIsCompleted(true)
        router.refresh()
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const handleUncomplete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setIsCompleted(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error uncompleting task:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onDelete(task.id)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task')
    }
  }

  const canDelete = () => {
    const hoursUntilDeadline = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursUntilDeadline >= 24
  }

  const completedBy = task.task_completions
    .map(c => ({ name: c.profiles.full_name || c.profiles.email }))

  return (
    <div className={`glass-card rounded-2xl p-6 transition-all duration-300 ${isCompleted ? 'opacity-60' : 'glass-card'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {task.description}
            </p>
          )}
        </div>
        <CountdownTimer deadline={new Date(task.deadline)} />
      </div>

      <SocialProgressBar
        completedCount={task.task_completions.length}
        totalCount={classroomMembersCount}
        completedBy={completedBy}
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={isCompleted ? handleUncomplete : handleComplete}
          className={`btn-modern btn-primary-modern flex items-center gap-2 ${
            isCompleted ? 'opacity-70' : ''
          }`}
        >
          {isCompleted ? (
            <>
              <span className="text-lg">{getIcon('xmark')}</span>
              <span className="text-sm font-semibold">Mark as Incomplete</span>
            </>
          ) : (
            <>
              <span className="text-lg">{getIcon('check')}</span>
              <span className="text-sm font-semibold">Mark as Complete</span>
            </>
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={!canDelete()}
          className={`btn-modern flex items-center gap-2 transition-all ${
            canDelete()
              ? 'btn-danger-modern'
              : 'btn-secondary-modern cursor-not-allowed opacity-50'
          }`}
        >
          <span className="text-lg">{getIcon('trash')}</span>
          <span className="text-sm font-semibold">Delete</span>
        </button>
      </div>
    </div>
  )
}
