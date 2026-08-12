import { createClient } from '@supabase/supabase-js'

// The project's public endpoint and publishable key. Baked in as defaults
// so a fresh clone builds and runs without any setup, and can still be
// overridden with a .env file if the project ever moves.
//
// Note this app has no login: the database grants the anonymous role access
// to the player tables, so anyone holding this key and the site URL can read
// and change the single player's progress. That is a deliberate trade for a
// one-child homework app. Restoring auth means re-adding the auth.users
// foreign key on players and dropping the `*_anon` policies.
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://qwytrbikxbbbhydvzpav.supabase.co'
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_KEY || 'sb_publishable_NU0f4jEVo7LaFcLgubTw1w_Jtxy3QNj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// One forge, one smith. There is no sign in, so the player is found by name.
const SOLO_NAME = 'Charlie'

const OFFLINE = 'Cannot reach the forge right now. Check the internet and try again in a minute.'

const isOffline = (error) =>
  error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')

// Pressing Start does this. The row is created on the very first press and
// reused forever after, so his progress survives clearing the browser and
// follows him to any device that opens the site.
export async function enterForge() {
  const { data: existing, error } = await supabase
    .from('players')
    .select('id')
    .eq('display_name', SOLO_NAME)
    .maybeSingle()

  if (error) return { error: isOffline(error) ? OFFLINE : 'Could not open the forge. Try again in a minute.' }
  if (existing) return { player: existing }

  const { data: created, error: createError } = await supabase
    .from('players')
    .insert({ display_name: SOLO_NAME })
    .select('id')
    .single()

  if (createError) {
    return { error: isOffline(createError) ? OFFLINE : 'Could not open the forge. Try again in a minute.' }
  }
  return { player: created }
}

export async function signOut() {
  // Nothing to sign out of, but the day-complete screen still offers it.
}

export async function loadPlayer() {
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('display_name', SOLO_NAME)
    .maybeSingle()
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

