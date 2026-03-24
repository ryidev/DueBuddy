import Link from 'next/link'

export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We've sent you a confirmation link. Please check your email to complete the sign-up process.
        </p>
        <div className="pt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
