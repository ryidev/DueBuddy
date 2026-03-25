import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskForm } from '@/components/task/TaskForm'
import { TaskList } from '@/components/dashboard/TaskList'
import { ClassroomMembers } from '@/components/classroom/ClassroomMembers'
import { UserProfile } from '@/components/auth/UserProfile'
import { LeaveClassroomButton } from '@/components/classroom/LeaveClassroomButton'

async function getClassroomData(classroomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('classroom_members')
    .select(`
      role,
      classrooms (
        id,
        name,
        unique_code,
        created_at,
        updated_at,
        owner_id
      )
    `)
    .eq('classroom_id', classroomId)
    .eq('profile_id', user.id)
    .single()

  if (!membership) {
    redirect('/')
  }

  // Get member count
  const { count } = await supabase
    .from('classroom_members')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroomId)

  // Get total tasks count
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('classroom_id', classroomId)

  // Get completed tasks count for this user in this classroom
  const { count: completedTasks } = await supabase
    .from('task_completions')
    .select('task_id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .in('task_id', (
      await supabase.from('tasks').select('id').eq('classroom_id', classroomId)
    ).data?.map(t => t.id) || [])

  // classrooms from a relational join is typed as array — extract the single object
  const classroom = Array.isArray(membership.classrooms)
    ? (membership.classrooms as any[])[0]
    : membership.classrooms as any

  return {
    classroom,
    role: membership.role,
    memberCount: count || 0,
    userId: user.id,
    totalTasks: totalTasks || 0,
    completedTasks: completedTasks || 0,
  }
}

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const data = await getClassroomData(resolvedParams.id)

  return (
    <>
      <div className="bg-animated">
        <div className="bg-animated::before"></div>
      </div>

      <div className="min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-header backdrop-blur-2xl bg-black/50 border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
               
                <div className="hidden sm:block h-8 w-px bg-foreground/20 "></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 sm:mt-0">
                  <h1 className="text-2xl font-bold text-foreground pr-2">
                    {data.classroom.name}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 sm:mt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Code:
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-mono font-bold">
                        {data.classroom.unique_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Tugas:
                      </span>
                      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                        {data.completedTasks} / {data.totalTasks} Selesai
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <LeaveClassroomButton classroomId={resolvedParams.id} role={data.role} />
                <div className="hidden sm:block">
                  <UserProfile />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Create Task Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-2H4a2 2 0 00-2-2v12a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 002-2h-2a2 2 0 00-2-2z" />
                  </svg>
                  Create New Task
                </h2>
                <TaskForm classroomId={resolvedParams.id} />
              </div>

              <div className="glass-card rounded-2xl p-6">
                <ClassroomMembers classroomId={resolvedParams.id} />
              </div>
            </div>

            {/* Right Column - Task List */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2a2 2 0 00-2-2z" />
                </svg>
                Tasks
              </h2>
              <TaskList
                classroomId={resolvedParams.id}
                classroomMembersCount={data.memberCount}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
