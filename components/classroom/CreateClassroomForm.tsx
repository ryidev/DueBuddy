'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateClassroomForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setName('')
        if (data.classrooms && data.classrooms.length > 0) {
          router.push(`/classroom/${data.classrooms[0].id}`)
        } else {
          router.refresh()
        }
      } else {
        alert(data.error || 'Failed to create classroom')
      }
    } catch (error) {
      console.error('Error creating classroom:', error)
      alert('Failed to create classroom')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="classroom-name" className="block text-sm font-semibold text-text-primary mb-2">
          <span className="mr-1">📝</span> Classroom name
        </label>
        <input
          id="classroom-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., CS 101 - Introduction to Programming"
          required
          className="input-modern"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full btn-modern btn-primary-modern py-4 text-base"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="spinner-modern" />
            <span>Creating...</span>
          </div>
        ) : (
          <>
            <span className="text-xl">➕</span>
            <span className="font-semibold">Create Classroom</span>
          </>
        )}
      </button>
    </form>
  )
}
