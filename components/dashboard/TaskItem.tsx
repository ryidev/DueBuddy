'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CountdownTimer } from './CountdownTimer'
import { SocialProgressBar } from './SocialProgressBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'


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
    author?: {
      full_name: string | null
      email: string
    }
    task_completions: TaskCompletion[]
  }
  classroomMembers: { id: string, full_name: string | null, email: string }[]
  classroomMembersCount: number
  currentUserId: string | undefined
  onDelete: (id: string) => void
  onUpdate?: () => void
}

export function TaskItem({
  task,
  classroomMembers,
  classroomMembersCount,
  currentUserId,
  onDelete,
  onUpdate,
}: TaskItemProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(
    task.task_completions.some(c => c.profile_id === currentUserId)
  )

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    isDestructive: boolean
    action: (() => Promise<void>) | null
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    action: null
  })

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))

  const handleComplete = async () => {
    closeConfirm()
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
      })
      if (response.ok) {
        setIsCompleted(true)
        onUpdate?.()
        router.refresh()
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const handleUncomplete = async () => {
    closeConfirm()
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setIsCompleted(false)
        onUpdate?.()
        router.refresh()
      }
    } catch (error) {
      console.error('Error uncompleting task:', error)
    }
  }

  const handleDelete = async () => {
    closeConfirm()
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

  const promptComplete = () => setConfirmConfig({
    isOpen: true,
    title: 'Complete Task',
    message: `Ready to turn in "${task.title}"?`,
    confirmText: 'Complete',
    isDestructive: false,
    action: handleComplete
  })

  const promptUncomplete = () => setConfirmConfig({
    isOpen: true,
    title: 'Mark Incomplete',
    message: `Undo completion for "${task.title}"?`,
    confirmText: 'Undo',
    isDestructive: true,
    action: handleUncomplete
  })

  const promptDelete = () => setConfirmConfig({
    isOpen: true,
    title: 'Delete Task',
    message: 'Are you sure you want to permanently delete this task? This cannot be undone.',
    confirmText: 'Delete',
    isDestructive: true,
    action: handleDelete
  })

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
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple">
              Made by {task.author?.full_name || task.author?.email || 'Teacher'}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-3">
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

      <div className="mt-4 border-t border-foreground/10 pt-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Member Progress
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2">
          {classroomMembers.map(member => {
            const hasCompleted = task.task_completions.some(c => c.profile_id === member.id)
            return (
              <div key={member.id} className="flex items-center gap-2 text-xs">
                <span className="flex-shrink-0 text-sm drop-shadow-sm">{hasCompleted ? '✅' : '❌'}</span>
                <span className={`truncate ${hasCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`} title={member.full_name || member.email}>
                  {member.full_name || member.email}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={isCompleted ? promptUncomplete : promptComplete}
          className={`btn-modern flex items-center gap-2 ${
            isCompleted 
              ? 'bg-black/20 dark:bg-white/20 backdrop-blur-3xl border-2 border-black/20 dark:border-white/30 hover:bg-black/30 dark:hover:bg-white/30 text-foreground transition-all duration-300 shadow-md font-bold' 
              : 'btn-primary-modern'
          }`}
        >
          {isCompleted ?(
            <>
              <span className="text-lg">❌</span>
              <span className="text-sm font-semibold">Mark as Incomplete</span>
            </>
          ) : (
            <>
              <span className="text-lg">✅</span>
              <span className="text-sm font-semibold">Mark as Complete</span>
            </>
          )}
        </button>

        <button
          onClick={promptDelete}
          disabled={!canDelete()}
          className={`btn-modern flex items-center gap-2 transition-all ${
            canDelete()
              ? 'btn-danger-modern'
              : 'btn-secondary-modern cursor-not-allowed opacity-50'
          }`}
        >
          <span className="font-semibold">Delete</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={() => confirmConfig.action?.()}
        onCancel={closeConfirm}
      />
    </div>
  )
}
