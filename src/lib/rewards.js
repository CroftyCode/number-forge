import { supabase } from './supabase.js'
import { isMastered, todayISO } from './engine.js'

/* ============================== levels ============================== */

// Each level costs a bit more than the last, so early ones come quickly
// and later ones feel earned.
const levelCost = (level) => 120 + (level - 1) * 80

const RANKS = [
  'Apprentice', 'Striker', 'Journeyman', 'Bladesmith', 'Toolsmith',
  'Master Smith', 'Forgewright', 'Forgemaster', 'Legend of the Forge'
]

export function levelFromXp(xpTotal) {
  let level = 1
  let spent = 0
  while (spent + levelCost(level) <= xpTotal) {
    spent += levelCost(level)
    level += 1
  }
  const need = levelCost(level)
  const into = xpTotal - spent
  return {
    level,
    rank: RANKS[Math.min(level - 1, RANKS.length - 1)],
    into,
    need,
    pct: Math.max(0, Math.min(100, Math.round((into / need) * 100)))
  }
}

/* ============================= unlocks ============================== */

// Cosmetics and badges he earns by playing. `test` gets everything it
// might need and returns true once the thing has been achieved.
export const REWARDS = [
  { code: 'anvil-iron', type: 'anvil', name: 'Iron anvil', note: 'Where everyone starts', test: () => true },
  { code: 'ember-amber', type: 'ember', name: 'Amber ember', note: 'The default forge glow', test: () => true },

  { code: 'streak-3', type: 'badge', name: 'Three day streak', note: 'Turned up three days running', test: ({ player }) => player.streak_current >= 3 || player.streak_longest >= 3 },
  { code: 'streak-7', type: 'badge', name: 'Week at the forge', note: 'Seven days without missing', test: ({ player }) => player.streak_current >= 7 || player.streak_longest >= 7 },
  { code: 'streak-14', type: 'badge', name: 'Fortnight of fire', note: 'Fourteen days running', test: ({ player }) => player.streak_current >= 14 || player.streak_longest >= 14 },

  { code: 'ember-blue', type: 'ember', name: 'Blue ember', note: 'Reach level 3', test: ({ level }) => level >= 3 },
  { code: 'ember-violet', type: 'ember', name: 'Violet ember', note: 'Reach level 6', test: ({ level }) => level >= 6 },
  { code: 'ember-white', type: 'ember', name: 'White ember', note: 'Reach level 9', test: ({ level }) => level >= 9 },

  { code: 'anvil-steel', type: 'anvil', name: 'Steel anvil', note: 'Master 5 topics', test: ({ mastered }) => mastered >= 5 },
  { code: 'anvil-gold', type: 'anvil', name: 'Gold anvil', note: 'Master 12 topics', test: ({ mastered }) => mastered >= 12 },
  { code: 'anvil-obsidian', type: 'anvil', name: 'Obsidian anvil', note: 'Master 20 topics', test: ({ mastered }) => mastered >= 20 },

  { code: 'combo-10', type: 'badge', name: 'Ten in a row', note: 'Ten correct without a miss', test: ({ bestRun }) => bestRun >= 10 },
  { code: 'combo-20', type: 'badge', name: 'Twenty in a row', note: 'Twenty correct without a miss', test: ({ bestRun }) => bestRun >= 20 },

  { code: 'boss-first', type: 'badge', name: 'Boss slain', note: 'Won your first boss battle', test: ({ bossWins }) => bossWins >= 1 },
  { code: 'boss-three', type: 'badge', name: 'Boss hunter', note: 'Won three boss battles', test: ({ bossWins }) => bossWins >= 3 }
]

export const rewardByCode = (code) => REWARDS.find((r) => r.code === code)

// Works out what he has just earned that he did not already have, writes
// the new ones, and hands them back so the UI can celebrate them.
export async function grantNewUnlocks(playerId, owned, context) {
  const have = new Set(owned.map((u) => u.item_code))
  const earned = REWARDS.filter((r) => !have.has(r.code) && r.test(context))
  if (!earned.length) return []

  await supabase.from('unlocks').insert(
    earned.map((r) => ({ player_id: playerId, item_code: r.code, item_type: r.type }))
  )
  return earned
}

/* =========================== boss battles =========================== */

export const BOSS_LENGTH = 6
export const BOSS_PASS = 5
export const BOSS_XP = 120

// Monday of the current week, so a boss battle is a once-a-week event.
export function weekStartISO() {
  const now = new Date(todayISO())
  const day = (now.getDay() + 6) % 7   // Monday = 0
  now.setDate(now.getDate() - day)
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

// He can face a boss once he has genuinely mastered enough to be tested on,
// and only once per week.
export function bossReady({ mastery, topics, battles }) {
  const masteredIds = topics
    .filter((t) => isMastered(mastery.find((m) => m.topic_id === t.id)))
    .map((t) => t.id)
  const already = battles.some((b) => b.week_start === weekStartISO())
  return { ready: masteredIds.length >= 3 && !already, masteredIds, already }
}

export async function loadBattles(playerId) {
  const { data } = await supabase
    .from('boss_battles')
    .select('*')
    .eq('player_id', playerId)
    .order('completed_at', { ascending: false })
  return data ?? []
}

export async function recordBattle({ playerId, topicIds, score, total, passed, xp }) {
  await supabase.from('boss_battles').insert({
    player_id: playerId,
    week_start: weekStartISO(),
    topics: topicIds,
    score,
    total,
    passed,
    xp_awarded: xp
  })
}
