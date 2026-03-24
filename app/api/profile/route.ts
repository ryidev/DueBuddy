import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/profile — fetch profile from profiles table
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ profile })
}

// PATCH /api/profile — update name and/or password
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { full_name, password } = body

  // Update display name in profiles table
  if (full_name !== undefined) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: full_name.trim() })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }
  }

  // Update password via auth if provided
  if (password && password.trim().length >= 6) {
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      return NextResponse.json({ error: pwError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
