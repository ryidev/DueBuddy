import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  const classroomId = resolvedParams.id

  // 1. Check user role in this classroom
  const { data: membership } = await supabase
    .from('classroom_members')
    .select('role')
    .eq('classroom_id', classroomId)
    .eq('profile_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  if (membership.role === 'owner') {
    // 2a. User is OWNER: Delete the entire classroom
    const { error: deleteError } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', classroomId)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, action: 'deleted' })
  } else {
    // 2b. User is MEMBER: Leave the classroom
    const { error: leaveError } = await supabase
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('profile_id', user.id)

    if (leaveError) {
      return NextResponse.json({ error: leaveError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, action: 'left' })
  }
}
