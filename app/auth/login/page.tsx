import { LoginForm } from '@/components/auth/LoginForm'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function LoginPage() {
  return (
    <>
      {/* Animated Background */}
      <div className="bg-animated">
        <div className="bg-animated::before"></div>
      </div>

      {/* Main Container */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold text-4xl shadow-elevated">
              Ryi
            </div>
            <h1 className="text-4xl font-bold text-gradient bg-clip-text text-transparent mt-6">
              Welcome Back
            </h1>
            <p className="text-base text-text-muted mt-2">
              Sign in to manage your tasks collaboratively
            </p>
          </div>

          {/* Login Form Card */}
          <div className="card-modern p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m-3-3h3m0 0v6m-6 0h6m-6 0v6m18 12l-8-8-4-4m0 0l-8 8-4 4m8-8v6m0 0l-8 8-8-8m0 0l-8 8-4 4" />
                </svg>
              </div>
            </div>

            <LoginForm />
          </div>

          {/* Theme Toggle */}
          <div className="text-center mt-6">
            <ThemeToggle />
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-text-muted">
            <p>
              Don't have an account?{' '}
              <a
                href="/auth/signup"
                className="font-semibold text-accent-purple hover:text-accent-pink transition-colors"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
