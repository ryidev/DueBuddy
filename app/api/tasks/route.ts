import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const classroomId = url.searchParams.get('classroom_id')

  let query = supabase
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

  if (classroomId) {
    query = query.eq('classroom_id', classroomId)
  }

  const { data, error } = await query.order('deadline', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ tasks: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { classroom_id, title, description, deadline } = body

  if (!classroom_id || !title || !deadline) {
    return NextResponse.json(
      { error: 'Missing required fields: classroom_id, title, deadline' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.from('tasks').insert({
    classroom_id,
    title,
    description,
    deadline,
    created_by: user.id,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ task: data }, { status: 201 })
}
