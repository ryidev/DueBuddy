import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_completions (
        profile_id,
        completed_at,
        profiles (
          email,
          full_name
        )
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json({ task: data })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const body = await request.json()
  const { title, description, deadline } = body

  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description, deadline })
    .eq('id', resolvedParams.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ task: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params

  // Check deadline before deletion
  const { data: task } = await supabase
    .from('tasks')
    .select('deadline')
    .eq('id', resolvedParams.id)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Enforce strict deadline rule
  const now = new Date()
  const deadline = new Date(task.deadline)
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilDeadline < 24) {
    return NextResponse.json(
      { error: 'Cannot delete tasks less than 24 hours before deadline' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', resolvedParams.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
