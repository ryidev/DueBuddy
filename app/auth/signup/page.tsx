import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <>
      <div className="animated-bg">
        <div className="animated-bg::before"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-3xl shadow-2xl pulse-glow">
              Ryi
            </div>
            <h1 className="text-3xl font-bold text-foreground mt-6">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Join DeadlineFocus to manage your tasks collaboratively
            </p>
          </div>

          {/* Signup Form */}
          <div className="glass-card rounded-2xl p-8">
            <SignupForm />
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
