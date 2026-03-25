import { Suspense } from 'react'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <>
      <div className="bg-animated">
        <div className="bg-animated::before"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold text-4xl shadow-elevated">
              Ryi
            </div>
            <h1 className="text-4xl font-bold text-gradient bg-clip-text text-transparent mt-6">
              Create Account
            </h1>
            <p className="text-base text-text-muted mt-2">
              Join DeadlineFocus to manage your tasks collaboratively
            </p>
          </div>

          {/* Signup Form */}
          <div className="card-modern p-8">
            <Suspense fallback={<div className="text-center text-zinc-500 py-4">Loading form...</div>}>
              <SignupForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="font-semibold text-primary hover:text-accent transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
