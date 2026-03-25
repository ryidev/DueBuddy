'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function SignOutButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleSignOut = async () => {
    setIsConfirmOpen(false)
    try {
      const { signOut } = await import('@/app/auth/actions')
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="btn-modern btn-secondary-modern py-2 px-3 text-sm flex items-center gap-2"
        title="Sign out"
      >
        <span className="font-semibold">Sign out</span>
      </button>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        isDestructive={true}
        onConfirm={handleSignOut}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}
