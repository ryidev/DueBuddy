import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's classroom memberships
    const { data: memberships, error: memberError } = await supabase
      .from('classroom_members')
      .select('role, classroom_id, profiles!inner(full_name, email)')
      .eq('profile_id', user.id)

    if (memberError) {
      console.error('Error fetching memberships:', memberError)
      return NextResponse.json({ error: memberError.message }, { status: 400 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ classrooms: [] })
    }

    // Get classroom details for each membership
    const classroomIds = memberships.map(m => m.classroom_id)
    const { data: classrooms, error: classroomError } = await supabase
      .from('classrooms')
      .select('*')
      .in('id', classroomIds)

    if (classroomError) {
      console.error('Error fetching classrooms:', classroomError)
      return NextResponse.json({ error: classroomError.message }, { status: 400 })
    }

    // Get member counts for each classroom
    const classroomIdCounts = await Promise.all(
      classroomIds.map(async (id) => {
        const { count } = await supabase
          .from('classroom_members')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', id)
        return { classroom_id: id, count: count || 0 }
      })
    )

    // Combine data
    const classroomsWithCounts = classrooms?.map(classroom => {
      const memberCount = classroomIdCounts.find(c => c.classroom_id === classroom.id)?.count || 0
      const membership = memberships.find(m => m.classroom_id === classroom.id)

      return {
        ...classroom,
        classroom_members: Array(memberCount).fill({}),
        role: membership?.role || 'contributor',
      }
    }) || []

    return NextResponse.json({ classrooms: classroomsWithCounts })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate unique classroom code
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create classroom using direct insert instead of RPC
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .insert({
        name,
        unique_code: uniqueCode,
        owner_id: user.id,
      })
      .select()
      .single()

    if (classroomError) {
      console.error('Error creating classroom:', classroomError)
      return NextResponse.json({ error: classroomError.message }, { status: 400 })
    }

    if (!classroom) {
      return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 })
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('classroom_members')
      .insert({
        classroom_id: classroom.id,
        profile_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Error adding owner to members:', memberError)
      // Don't fail the request, the classroom was created
    }

    // Return the created classroom with member count
    const classroomsWithCounts = [{
      ...classroom,
      classroom_members: [{ profiles: { full_name: 'You', email: user.email } }],
      role: 'owner',
    }]

    return NextResponse.json({ classrooms: classroomsWithCounts }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
