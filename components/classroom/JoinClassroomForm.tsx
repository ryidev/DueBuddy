'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'


export function JoinClassroomForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      if (response.ok) {
        setCode('')
        router.refresh()
        alert('Successfully joined classroom!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join classroom')
      }
    } catch (error) {
      console.error('Error joining classroom:', error)
      alert('Failed to join classroom')
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
    </form>
  )
}
