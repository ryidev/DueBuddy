import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys) {
    return NextResponse.json(
      { error: 'Missing required fields: endpoint, keys' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      profile_id: user.id,
      endpoint,
      keys,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
