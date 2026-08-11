import { createClient } from '@supabase/supabase-js'

// These are the project's public endpoint and publishable key. They are
// safe to ship in the bundle: row level security on the database is what
// actually protects the data, not secrecy of this key. Baked in as
// defaults so a fresh clone builds and runs without any setup, and can
// still be overridden with a .env file if the project ever moves.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qwytrbikxbbbhydvzpav.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_NU0f4jEVo7LaFcLgubTw1w_Jtxy3QNj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// The player only ever sees a name and a 4 digit PIN.
// Underneath, that maps to a real Supabase account so row level
// security does the actual work of keeping his data his.
const DOMAIN = 'players.numberforge.local'

const slug = (name) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const credentials = (name, pin) => ({
  email: `${slug(name)}@${DOMAIN}`,
  // Supabase requires 6+ characters, so the PIN is padded deterministically.
  password: `nf-${pin}-forge`
})

export async function signIn(name, pin) {
  const { email, password } = credentials(name, pin)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'That name and PIN do not match. Try again.' }
  return { user: data.user }
}

export async function signUp(name, pin) {
  const { email, password } = credentials(name, pin)
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  const { error: playerError } = await supabase.from('players').insert({
    user_id: data.user.id,
    display_name: name.trim()
  })
  if (playerError) return { error: playerError.message }
  return { user: data.user }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function loadPlayer() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return null

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', auth.user.id)
    .single()
  if (!player) return null

  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('*')
    .eq('player_id', player.id)

  const { data: unlocks } = await supabase
    .from('unlocks')
    .select('item_code, item_type')
    .eq('player_id', player.id)

  return { player, mastery: mastery ?? [], unlocks: unlocks ?? [] }
}
