'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface LeaveClassroomButtonProps {
  classroomId: string
  role: string
}

export function LeaveClassroomButton({ classroomId, role }: LeaveClassroomButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const isOwner = role === 'owner'
  const actionText = isOwner ? 'Delete Classroom' : 'Leave Classroom'
  const confirmText = isOwner 
    ? 'Are you sure you want to DELETE this classroom? This action cannot be undone and all tasks will be lost.'
    : 'Are you sure you want to LEAVE this classroom?'

  const handleAction = async () => {
    setIsConfirmOpen(false)
    setLoading(true)
    try {
      const response = await fetch(`/api/classrooms/${classroomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Redirect to dashboard
        router.push('/')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${actionText.toLowerCase()}`)
        setLoading(false)
      }
    } catch (error) {
      console.error(`Error ${actionText.toLowerCase()}:`, error)
      alert(`Failed to ${actionText.toLowerCase()}`)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={loading}
        className="btn-modern btn-danger-modern py-2 px-4 text-sm flex items-center gap-2"
        title={actionText}
      >
        {loading ? (
          <div className="spinner-modern w-4 h-4 border-2" />
        ) : null}
        <span className="font-semibold">{actionText}</span>
      </button>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={actionText}
        message={confirmText}
        confirmText={isOwner ? 'Delete' : 'Leave'}
        isDestructive={true}
        onConfirm={handleAction}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}
