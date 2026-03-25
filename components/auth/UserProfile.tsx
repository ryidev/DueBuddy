'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { PushSubscription } from '@/components/notification/PushSubscription'

interface Profile {
  full_name: string | null
  email: string
}

export function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  // Close modal on backdrop click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false)
      }
    }
    if (showModal) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showModal])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const { profile } = await res.json()
        setProfile(profile)
        setEditName(profile.full_name || '')
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/app/auth/actions')
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const openModal = () => {
    setEditName(profile?.full_name || '')
    setEditPassword('')
    setConfirmPassword('')
    setSaveMsg(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (editPassword && editPassword !== confirmPassword) {
      setSaveMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (editPassword && editPassword.length < 6) {
      setSaveMsg({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setSaving(true)
    setSaveMsg(null)

    try {
      const body: Record<string, string> = { full_name: editName }
      if (editPassword) body.password = editPassword

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveMsg({ type: 'error', text: data.error || 'Failed to update profile' })
        return
      }

      setSaveMsg({ type: 'success', text: 'Profile updated!' })
      // Refresh profile display
      await fetchProfile()
      // Auto-close after success
      setTimeout(() => setShowModal(false), 1200)
    } catch (err) {
      setSaveMsg({ type: 'error', text: 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center liquid-glass-static">
        <div className="spinner-modern w-4 h-4 border-2" />
      </div>
    )
  }

  return (
    <>
      {/* Profile Row */}
      <div className="flex items-center gap-3">
        {/* Clickable Avatar */}
        <button
          onClick={openModal}
          className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg text-sm transition-all duration-200 hover:scale-110 hover:shadow-purple-500/40 hover:shadow-lg"
          title="Edit profile"
        >
          {initial}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-bg-primary" />
        </button>

        {/* Name + email — always visible now */}
        <button onClick={openModal} className="text-left group">
          <p className="text-sm font-semibold text-text-primary leading-tight group-hover:text-gradient transition-colors">
            {profile?.full_name || 'Set your name'}
          </p>
          <p className="text-xs text-text-muted">{profile?.email}</p>
        </button>
      </div>


      {/* Edit Profile Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        >
          <div
            ref={modalRef}
            className="liquid-glass w-full max-w-sm p-6 rounded-2xl"
            style={{ animation: 'modal-in 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {initial}
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Edit Profile</h2>
                  <p className="text-xs text-text-muted">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="input-modern"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  New Password <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="input-modern"
                />
              </div>

              {/* Confirm Password */}
              {editPassword && (
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input-modern"
                  />
                </div>
              )}

              {/* Notifications */}
              <div className="pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-white/5 dark:bg-white/5">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Push Notifications</h3>
                    <p className="text-xs text-text-muted mt-0.5">Alerts for task deadlines</p>
                  </div>
                  <PushSubscription />
                </div>
              </div>

              {/* Message */}
              {saveMsg && (
                <div
                  className="text-sm px-3 py-2.5 rounded-xl font-medium"
                  style={{
                    background: saveMsg.type === 'success'
                      ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: saveMsg.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${saveMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {saveMsg.type === 'success' ? '✅ ' : '⚠️ '}{saveMsg.text}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-modern btn-secondary-modern py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="flex-1 btn-modern btn-primary-modern py-3 text-sm"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner-modern w-4 h-4 border-2" />
                      <span>Saving...</span>
                    </div>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes modal-in {
          0%   { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
