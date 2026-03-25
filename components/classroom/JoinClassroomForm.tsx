'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'


export function JoinClassroomForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (response.ok) {
        setCode('')
        setSuccess(true)
        if (data.classroom_id) {
          // Navigate directly to the classroom (works for new join AND already-member)
          router.push(`/classroom/${data.classroom_id}`)
        } else {
          router.refresh()
        }
      } else {
        setError(data.error || 'Failed to join classroom')
      }
    } catch (err) {
      console.error('Error joining classroom:', err)
      setError('Failed to join classroom. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="classroom-code" className="block text-sm font-semibold text-text-primary mb-2">
          <span className="mr-2">🔑</span>
          Classroom code
        </label>
        <input
          id="classroom-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-character code"
          maxLength={6}
          required
          className="input-modern text-center text-xl tracking-widest font-mono uppercase"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full btn-modern btn-success-modern py-4 text-base"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="spinner-modern"></div>
            <span>Joining...</span>
          </div>
        ) : (
          <>
            <span className="text-2xl mr-2">🚀</span>
            <span className="text-base font-semibold">Join Classroom</span>
          </>
        )}
      </button>

      {/* Inline feedback */}
      {error && (
        <div className="text-sm px-3 py-2.5 rounded-xl font-medium"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="text-sm px-3 py-2.5 rounded-xl font-medium"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
          ✅ Redirecting to classroom...
        </div>
      )}
    </form>
  )
}
