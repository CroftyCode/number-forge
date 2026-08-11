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
// Must be a domain Supabase's email validator accepts. A `.local` TLD is
// rejected outright, which made every sign up fail. example.com is
// reserved by RFC 2606, so it is always valid and can never receive mail.
const DOMAIN = 'players.example.com'

const slug = (name) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const credentials = (name, pin) => ({
  email: `${slug(name)}@${DOMAIN}`,
  // Supabase requires 6+ characters, so the PIN is padded deterministically.
  password: `nf-${pin}-forge`
})

// A dead connection and a wrong PIN are different problems, and telling a
// player his PIN is wrong when the forge is actually asleep just makes him
// type it again. Supabase reports unreachable as a failed fetch.
const isOffline = (error) =>
  error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')

const OFFLINE = 'Cannot reach the forge right now. Check the internet and try again in a minute.'

export async function signIn(name, pin) {
  const { email, password } = credentials(name, pin)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: isOffline(error) ? OFFLINE : 'That name and PIN do not match. Try again.' }
  }
  return { user: data.user }
}

export async function signUp(name, pin) {
  const { email, password } = credentials(name, pin)
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    // Never show the raw message: it talks about email addresses, and this
    // form only ever asked for a name.
    if (isOffline(error)) return { error: OFFLINE }
    if (error.message?.includes('already registered')) {
      return { error: 'That name is taken. Pick another one, or sign in with your PIN.' }
    }
    return { error: 'Could not set up that smith. Try a different name.' }
  }

  const { error: playerError } = await supabase.from('players').insert({
    user_id: data.user.id,
    display_name: name.trim()
  })
  if (playerError) return { error: 'Set up your smith but could not save it. Try signing in.' }
  return { user: data.user }
}

export async function signOut() {
  await supabase.auth.signOut()
}

// This forge has exactly one smith, so there is no login screen. The single
// account below is created on first press and reused forever after, which
// keeps progress attached to a real Supabase user and leaves row level
// security doing its job unchanged.
//
// The password sits in the shipped bundle. That is deliberate: it is not
// protecting anything from him, it just gives the database a user to hang
// his progress on. Anyone who found the URL could reach the same account.
const SOLO = {
  name: 'Charlie',
  email: `charlie@${DOMAIN}`,
  password: 'nf-forge-charlie-2026'
}

export async function enterForge() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: SOLO.email,
    password: SOLO.password
  })
  if (!error) return { user: data.user }
  if (isOffline(error)) return { error: OFFLINE }

  // No account yet: this is the very first press. Make it, then carry on.
  const { data: created, error: signUpError } = await supabase.auth.signUp({
    email: SOLO.email,
    password: SOLO.password
  })
  if (signUpError) {
    return { error: isOffline(signUpError) ? OFFLINE : 'Could not open the forge. Try again in a minute.' }
  }
  if (!created.session) {
    // Email confirmation is still switched on, so there is no session to
    // work with and the player row below would be refused by RLS.
    return { error: 'The forge is not finished being set up yet.' }
  }

  const { error: playerError } = await supabase.from('players').insert({
    user_id: created.user.id,
    display_name: SOLO.name
  })
  if (playerError) return { error: 'Could not open the forge. Try again in a minute.' }
  return { user: created.user }
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
