import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { code } = body

  if (!code) {
    return NextResponse.json({ error: 'Classroom code is required' }, { status: 400 })
  }

  // Find classroom by code
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('unique_code', code)
    .single()

  if (!classroom) {
    return NextResponse.json({ error: 'Invalid classroom code' }, { status: 404 })
  }

  // Add user as contributor
  const { error } = await supabase
    .from('classroom_members')
    .insert({
      classroom_id: classroom.id,
      profile_id: user.id,
      role: 'contributor',
    })

  if (error) {
    // Check if already a member
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You are already a member of this classroom' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
