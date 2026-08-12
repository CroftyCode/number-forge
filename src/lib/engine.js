import { supabase } from './supabase.js'

export const DIFFICULTY = { EASY: 1, MEDIUM: 2, HARD: 3 }
export const DIFFICULTY_NAME = { 1: 'Warm', 2: 'Hot', 3: 'White hot' }

const WINDOW = 6           // rolling window of recent attempts per topic
const PROMOTE_AT = 5       // correct out of WINDOW to step difficulty up
const DEMOTE_AT = 2        // correct out of WINDOW to step difficulty down
const MASTERED = 80        // mastery score that marks a topic complete

const XP = { 1: 8, 2: 14, 3: 22 }
const HINT_PENALTY = 0.5
const STREAK_BONUS_EVERY = 5   // every 5 in a row within a session
const STREAK_BONUS = 15

export const todayISO = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

export function xpForAttempt({ correct, difficulty, hintsUsed, runLength }) {
  if (!correct) return 0
  let xp = XP[difficulty] ?? XP[1]
  if (hintsUsed > 0) xp = Math.round(xp * HINT_PENALTY)
  if (runLength > 0 && runLength % STREAK_BONUS_EVERY === 0) xp += STREAK_BONUS
  return xp
}

// Mastery drifts towards recent performance rather than jumping.
// Harder questions move it further, so grinding easy ones will not
// mark a topic complete on its own.
export function nextMastery(current, { correct, difficulty }) {
  const target = correct ? 40 + difficulty * 20 : 0
  const weight = correct ? 0.18 + difficulty * 0.04 : 0.3
  const next = current + (target - current) * weight
  return Math.max(0, Math.min(100, Math.round(next * 100) / 100))
}

export function nextDifficulty(current, window) {
  if (window.length < WINDOW) return current
  const correct = window.filter(Boolean).length
  if (correct >= PROMOTE_AT && current < DIFFICULTY.HARD) return current + 1
  if (correct <= DEMOTE_AT && current > DIFFICULTY.EASY) return current - 1
  return current
}

export function pushWindow(window, correct) {
  return [...window, correct].slice(-WINDOW)
}

// Spaced retrieval: the better he knows it, the longer until it returns.
export function nextReviewDate(mastery) {
  const days = mastery >= MASTERED ? 10 : mastery >= 60 ? 5 : mastery >= 35 ? 3 : 1
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

export const isMastered = (m) => (m?.mastery ?? 0) >= MASTERED

// Picks what he works on next. Overdue reviews come first so old topics
// do not rot, then the next untaught topic whose prerequisites are met.
export function chooseNextTopic(topics, masteryByTopic) {
  const today = todayISO()

  const overdue = topics
    .filter((t) => {
      const m = masteryByTopic[t.id]
      return m?.taught && m.next_review_on && m.next_review_on <= today && m.mastery < 95
    })
    .sort((a, b) => (masteryByTopic[a.id].mastery - masteryByTopic[b.id].mastery))

  if (overdue.length) return { topic: overdue[0], reason: 'review' }

  const unfinished = topics
    .filter((t) => {
      const m = masteryByTopic[t.id]
      if (isMastered(m)) return false
      return t.prerequisites.every((p) => isMastered(masteryByTopic[p]) || !masteryByTopic[p]?.taught === false)
    })
    .sort((a, b) => a.sequence_order - b.sequence_order)

  const readiest = unfinished.find((t) =>
    t.prerequisites.every((p) => isMastered(masteryByTopic[p]))
  )

  const topic = readiest ?? unfinished[0] ?? topics[0]
  const m = masteryByTopic[topic.id]
  return { topic, reason: m?.taught ? 'practice' : 'new' }
}

export function streakAfterPlay({ streak_current, last_played_on, streak_freezes }) {
  const today = todayISO()
  if (last_played_on === today) return { streak: streak_current, freezes: streak_freezes, used: false }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const y = yesterday.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

  if (!last_played_on || last_played_on === y) {
    return { streak: streak_current + 1, freezes: streak_freezes, used: false }
  }
  // Missed at least one day. Spend a freeze if he has one.
  if (streak_freezes > 0) {
    return { streak: streak_current + 1, freezes: streak_freezes - 1, used: true }
  }
  return { streak: 1, freezes: streak_freezes, used: false }
}

export async function recordAttempt({
  playerId, sessionId, topicId, mode, difficulty,
  question, expected, given, correct, misconceptionCode, hintsUsed, timeMs, xp
}) {
  await supabase.from('attempts').insert({
    player_id: playerId,
    session_id: sessionId,
    topic_id: topicId,
    mode,
    difficulty,
    question,
    expected_answer: String(expected),
    given_answer: given == null ? null : String(given),
    correct,
    misconception_code: misconceptionCode ?? null,
    hints_used: hintsUsed,
    time_taken_ms: timeMs,
    xp_awarded: xp
  })
}

export async function saveMastery(playerId, topicId, row) {
  await supabase.from('topic_mastery').upsert(
    {
      player_id: playerId,
      topic_id: topicId,
      mastery: row.mastery,
      difficulty: row.difficulty,
      taught: row.taught,
      attempts: row.attempts,
      correct: row.correct,
      rolling_window: row.rolling_window,
      last_seen_at: new Date().toISOString(),
      next_review_on: row.next_review_on
    },
    { onConflict: 'player_id,topic_id' }
  )
}
