'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/app/auth/actions'
import { getIcon } from '@/components/ui/Icons'

export function LoginForm() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const { login } = await import('@/app/auth/actions')
      await login(formData)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full btn-modern btn-secondary-modern py-4 group"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="spinner-modern"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <span className="text-base flex items-center gap-3">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
              onError={(e) => { e.currentTarget.src = '/api/placeholder-google.svg' }}
            />
            <span>Continue with Google</span>
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-border-color"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-inherit text-text-muted text-sm font-medium">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
            <span className="mr-2">{getIcon('email')}</span>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-modern"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
            <span className="mr-2">{getIcon('key')}</span>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-modern"
            placeholder="•••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-modern btn-primary-modern py-4 text-base"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="spinner-modern"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <span className="text-base font-semibold">Sign in</span>
          )}
        </button>
      </form>
    </div>
  )
}
