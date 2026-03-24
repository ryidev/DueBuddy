'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'


interface TaskFormProps {
  classroomId: string
  onSubmit?: () => void
}

export function TaskForm({ classroomId, onSubmit }: TaskFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !deadline) return

    setLoading(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroom_id: classroomId,
          title: title.trim(),
          description: description.trim(),
          deadline,
        }),
      })

      if (response.ok) {
        setTitle('')
        setDescription('')
        setDeadline('')
        router.refresh()
        onSubmit?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-sm font-medium text-foreground mb-2">
          Task title <span className="text-red-400">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Complete assignment 3"
          required
          className="input-modern"
        />
      </div>

      <div>
        <label htmlFor="task-description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
          className="input-modern resize-none"
        />
      </div>

      <div>
        <label htmlFor="task-deadline" className="block text-sm font-medium text-foreground mb-2">
          Deadline <span className="text-red-400">*</span>
        </label>
        <input
          id="task-deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="input-modern"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim() || !deadline}
        className="w-full btn-modern btn-primary-modern py-4 text-base"
      >
        {loading ? (
          <>
            <div className="spinner-modern"></div>
            <span>Creating...</span>
          </>
        ) : (
          <>
            <span className="text-2xl mr-2">➕</span>
            <span className="text-base font-semibold">Create Task</span>
          </>
        )}
      </button>
    </form>
  )
}
