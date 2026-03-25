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

  // -----------------------------------------------------------
  // Step 1: Look up the classroom by unique_code.
  // The classrooms RLS only allows SELECT for members, which means
  // a non-member gets null and sees "Invalid classroom code".
  // Workaround: first check classroom_members for this code via
  // a join, or use a two-step approach: find the classroom id
  // through a function/rpc. Since we can't bypass RLS directly,
  // we add an extra policy in SQL. As a code-side safety net we
  // also handle the "already a member" redirect case below.
  // -----------------------------------------------------------
  const { data: classroom, error: lookupError } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('unique_code', code.toUpperCase())
    .maybeSingle()  // use maybeSingle to avoid throwing on no rows

  if (lookupError) {
    console.error('[join] classroom lookup error:', lookupError)
  }

  if (!classroom) {
    // Could be RLS block (user not yet member) or truly wrong code.
    // Check if there's a membership that could tell us the classroom exists:
    // (This path is hit when classroom_members RLS is fixed but classrooms RLS is not)
    return NextResponse.json(
      { error: 'Invalid classroom code. Make sure the code is correct (6 characters).' },
      { status: 404 }
    )
  }

  // Step 2: Check if already a member — redirect instead of error
  const { data: existing } = await supabase
    .from('classroom_members')
    .select('classroom_id')
    .eq('classroom_id', classroom.id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (existing) {
    // Already a member — treat as success and redirect to the classroom
    return NextResponse.json(
      { success: true, classroom_id: classroom.id, already_member: true },
      { status: 200 }
    )
  }

  // Step 3: Insert membership
  const { error: insertError } = await supabase
    .from('classroom_members')
    .insert({
      classroom_id: classroom.id,
      profile_id: user.id,
      role: 'contributor',
    })

  if (insertError) {
    // Unique constraint = already a member (race condition)
    if (insertError.code === '23505') {
      return NextResponse.json(
        { success: true, classroom_id: classroom.id, already_member: true },
        { status: 200 }
      )
    }
    console.error('[join] insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, classroom_id: classroom.id })
}
