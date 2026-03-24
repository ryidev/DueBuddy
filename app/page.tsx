import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateClassroomForm } from '@/components/classroom/CreateClassroomForm'
import { JoinClassroomForm } from '@/components/classroom/JoinClassroomForm'
import { UserProfile } from '@/components/auth/UserProfile'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Step 1: get membership IDs
  const { data: memberships, error: membershipsError } = await supabase
    .from('classroom_members')
    .select('classroom_id, role')
    .eq('profile_id', user.id)

  if (membershipsError) {
    console.error('[page.tsx] classroom_members query error:', membershipsError)
  }
  console.log('[page.tsx] user.id:', user.id, '| memberships:', memberships)

  // Step 2: fetch classrooms by those IDs
  let classrooms: any[] = []
  if (memberships && memberships.length > 0) {
    const classroomIds = memberships.map((m: any) => m.classroom_id)
    const { data, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*')
      .in('id', classroomIds)

    if (classroomsError) {
      console.error('[page.tsx] classrooms query error:', classroomsError)
    }
    console.log('[page.tsx] classrooms fetched:', data)

    if (data) {
      // Merge role into each classroom
      const roleMap = Object.fromEntries(memberships.map((m: any) => [m.classroom_id, m.role]))
      classrooms = data.map((c: any) => ({ ...c, role: roleMap[c.id] || 'member' }))
    }
  }

  return (
    <div className="min-h-screen relative bg-background bg-animated-extra">
      {/* Animated Background */}
      <div className="bg-animated" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <UserProfile />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left Column - Forms */}
          <div className="space-y-6 lg:col-span-1">
            {/* Create Classroom Card */}
            <div className="liquid-glass p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white text-base shadow-md">
                  📝
                </div>
                <h2 className="text-base font-bold text-text-primary">Create Classroom</h2>
              </div>
              <CreateClassroomForm />
            </div>

            {/* Join Classroom Card */}
            <div className="liquid-glass p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base shadow-md">
                  🔗
                </div>
                <h2 className="text-base font-bold text-text-primary">Join Classroom</h2>
              </div>
              <JoinClassroomForm />
            </div>
          </div>

          {/* Right Column - Classroom List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                Your Classrooms
                {classrooms.length > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 text-sm font-semibold rounded-full"
                    style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    {classrooms.length}
                  </span>
                )}
              </h2>
            </div>

            {/* Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {classrooms.length > 0 ? (
                classrooms.map((cls) => (
                  <Link key={cls.id} href={`/classroom/${cls.id}`} className="group block">
                    <div className="liquid-glass-card p-5 h-full">
                      <div className="relative z-10">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-base text-text-primary group-hover:text-gradient transition-colors pr-2 line-clamp-2">
                            {cls.name}
                          </h3>
                          {cls.role === 'owner' && (
                            <span className="badge-warning flex-shrink-0 ml-2">👑 Owner</span>
                          )}
                        </div>

                        {/* Code */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs text-text-muted">Code:</span>
                          <span className="font-mono text-sm font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--accent-purple)' }}>
                            {cls.unique_code}
                          </span>
                        </div>

                        {/* Open button */}
                        <div className="w-full py-2.5 text-sm font-semibold text-center rounded-xl transition-all duration-200"
                          style={{ background: 'var(--gradient-primary)', color: '#fff', boxShadow: 'var(--glow-subtle)' }}>
                          Open Classroom →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="liquid-glass-static p-12 text-center rounded-2xl">
                    <div className="text-5xl mb-4">🏫</div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">No Classrooms Yet</h3>
                    <p className="text-text-muted text-sm">
                      Create a new classroom or join one using a code on the left.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}