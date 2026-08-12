import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, enterForge, loadPlayer } from './lib/supabase'
import {
  DIFFICULTY_NAME, chooseNextTopic, nextMastery, nextDifficulty, pushWindow,
  nextReviewDate, xpForAttempt, recordAttempt, saveMastery, streakAfterPlay, todayISO
} from './lib/engine'
import { topicContent, generateQuestion, isCorrect, findSlip, hasContent } from './content/topics'
import {
  levelFromXp, grantNewUnlocks, REWARDS, loadBattles, recordBattle,
  bossReady, BOSS_LENGTH, BOSS_PASS, BOSS_XP
} from './lib/rewards'
import { isMastered } from './lib/engine'
import Scratchpad from './components/Scratchpad'

const DIAGNOSTIC_LENGTH = 12

// Escalating noise for a run of correct answers. Keeps the middle of a
// session from feeling like a worksheet.
const COMBO_WORDS = [
  { at: 3, text: 'HEATING UP' },
  { at: 5, text: 'RED HOT' },
  { at: 8, text: 'WHITE HOT' },
  { at: 12, text: 'UNSTOPPABLE' },
  { at: 16, text: 'FORGE MASTER' },
  { at: 20, text: 'LEGENDARY' }
]
const comboWord = (n) => [...COMBO_WORDS].reverse().find((c) => n >= c.at)?.text ?? null

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  return online
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const [state, setState] = useState(null)      // { player, mastery, unlocks }
  const [topics, setTopics] = useState([])
  const [view, setView] = useState('loading')   // auth | lesson | question | done | parent
  const [sessionId, setSessionId] = useState(null)
  const [sessionXp, setSessionXp] = useState(0)
  const [run, setRun] = useState(0)             // correct in a row this session
  const [current, setCurrent] = useState(null)  // { topic, question, reason }
  const [qSeq, setQSeq] = useState(0)           // bumps once per question shown
  const [pad, setPad] = useState(true)
  const [diagnostic, setDiagnostic] = useState(null)
  const [battles, setBattles] = useState([])
  const [bestRun, setBestRun] = useState(0)     // longest correct run this session
  const [boss, setBoss] = useState(null)        // { queue, index, score } while fighting
  const [prizes, setPrizes] = useState([])      // freshly earned unlocks, to celebrate
  const [levelUp, setLevelUp] = useState(null)  // the level he just reached
  const [flash, setFlash] = useState(null)      // 'hit' | 'miss', drives the screen pulse
  const online = useOnline()

  // The authoritative XP total. Kept in a ref so several awards in quick
  // succession cannot race each other through React's async state.
  const xpRef = useRef(0)

  // XP is banked the moment it is earned. Waiting until the end of the day
  // meant closing the tab early threw away everything, including a boss win.
  async function awardXp(amount) {
    if (!amount || !state?.player) return
    xpRef.current += amount
    const total = xpRef.current
    setState((s) => (s ? { ...s, player: { ...s.player, xp_total: total } } : s))
    await supabase.from('players').update({ xp_total: total }).eq('id', state.player.id)
  }

  // There is no session to restore, so the Start screen is always the way in.
  useEffect(() => {
    setView('auth')
    setBooted(true)
  }, [])

  async function boot() {
    const loaded = await loadPlayer()
    if (!loaded) { setView('auth'); return }
    const { data: allTopics } = await supabase.from('topics').select('*').order('sequence_order')
    const playable = (allTopics ?? []).filter((t) => hasContent(t.id))
    setTopics(playable)
    setState(loaded)

    const { data: session } = await supabase
      .from('sessions')
      .insert({ player_id: loaded.player.id })
      .select()
      .single()
    setSessionId(session?.id ?? null)
    setBattles(await loadBattles(loaded.player.id))
    xpRef.current = loaded.player.xp_total

    if (!loaded.player.diagnostic_complete) {
      startDiagnostic(playable)
    } else {
      advance(playable, loaded)
    }
  }

  /* --------------------------- diagnostic --------------------------- */

  function startDiagnostic(playable) {
    const spread = []
    const pool = [...playable]
    while (spread.length < Math.min(DIAGNOSTIC_LENGTH, pool.length * 2) && pool.length) {
      const t = pool[spread.length % pool.length]
      spread.push({ topic: t, difficulty: spread.length < 6 ? 1 : 2 })
    }
    setDiagnostic({ queue: spread, index: 0, results: {} })
    const first = spread[0]
    setQSeq((n) => n + 1)
    setCurrent({
      topic: first.topic,
      reason: 'diagnostic',
      question: generateQuestion(first.topic.id, first.difficulty)
    })
    setView('question')
  }

  /* ---------------------------- flow -------------------------------- */

  function masteryMap(loaded) {
    const map = {}
    for (const m of loaded.mastery) map[m.topic_id] = m
    return map
  }

  function advance(playable = topics, loaded = state) {
    const map = masteryMap(loaded)
    const { topic, reason } = chooseNextTopic(playable, map)
    const m = map[topic.id]
    const difficulty = m?.difficulty ?? 1

    if (!m?.taught) {
      setCurrent({ topic, reason: 'new', question: null })
      setView('lesson')
      return
    }
    setQSeq((n) => n + 1)
    setCurrent({ topic, reason, question: generateQuestion(topic.id, difficulty) })
    setView('question')
  }

  async function finishLesson() {
    const map = masteryMap(state)
    const existing = map[current.topic.id]
    const row = {
      mastery: existing?.mastery ?? 0,
      difficulty: existing?.difficulty ?? 1,
      taught: true,
      attempts: existing?.attempts ?? 0,
      correct: existing?.correct ?? 0,
      rolling_window: existing?.rolling_window ?? [],
      next_review_on: existing?.next_review_on ?? todayISO()
    }
    await saveMastery(state.player.id, current.topic.id, row)
    const updated = {
      ...state,
      mastery: [
        ...state.mastery.filter((m) => m.topic_id !== current.topic.id),
        { ...row, topic_id: current.topic.id, player_id: state.player.id }
      ]
    }
    setState(updated)
    setQSeq((n) => n + 1)
    setCurrent({ ...current, question: generateQuestion(current.topic.id, row.difficulty) })
    setView('question')
  }

  async function submitAnswer({ given, hintsUsed, timeMs }) {
    const { topic, question } = current
    const correct = isCorrect(given, question.answer)
    const slip = correct ? null : findSlip(topic.id, given, question)
    const newRun = correct ? run + 1 : 0
    const xp = xpForAttempt({ correct, difficulty: question.difficulty, hintsUsed, runLength: newRun })

    setRun(newRun)
    setBestRun((v) => Math.max(v, newRun))
    setSessionXp((v) => v + xp)
    setFlash(correct ? 'hit' : 'miss')
    setTimeout(() => setFlash(null), 420)

    // Celebrate the level the moment it is crossed. The HUD updates live, so
    // waiting until bedtime would show the new level before congratulating him.
    const beforeXp = xpRef.current
    if (levelFromXp(beforeXp + xp).level > levelFromXp(beforeXp).level) {
      setLevelUp(levelFromXp(beforeXp + xp))
    }
    await awardXp(xp)

    await recordAttempt({
      playerId: state.player.id,
      sessionId,
      topicId: topic.id,
      mode: diagnostic ? 'diagnostic' : current.reason === 'review' ? 'review' : 'practice',
      difficulty: question.difficulty,
      question: { prompt: question.prompt },
      expected: question.answer,
      given,
      correct,
      misconceptionCode: slip?.code,
      hintsUsed,
      timeMs,
      xp
    })

    return { correct, slip, xp }
  }

  async function nextQuestion() {
    if (boss) return advanceBoss()
    if (diagnostic) return advanceDiagnostic()

    const { topic, question } = current
    const map = masteryMap(state)
    const existing = map[topic.id] ?? { mastery: 0, difficulty: 1, attempts: 0, correct: 0, rolling_window: [] }
    const lastCorrect = lastResult.current

    const window = pushWindow(existing.rolling_window ?? [], lastCorrect)
    const mastery = nextMastery(Number(existing.mastery ?? 0), { correct: lastCorrect, difficulty: question.difficulty })
    const row = {
      mastery,
      difficulty: nextDifficulty(existing.difficulty ?? 1, window),
      taught: true,
      attempts: (existing.attempts ?? 0) + 1,
      correct: (existing.correct ?? 0) + (lastCorrect ? 1 : 0),
      rolling_window: window,
      next_review_on: nextReviewDate(mastery)
    }
    await saveMastery(state.player.id, topic.id, row)

    const updated = {
      ...state,
      mastery: [
        ...state.mastery.filter((m) => m.topic_id !== topic.id),
        { ...row, topic_id: topic.id, player_id: state.player.id }
      ]
    }
    setState(updated)

    if (sessionXp >= state.player.daily_xp_goal) return finishDay(updated)

    // Stay on the topic while it is still shaky, otherwise move on.
    if (row.mastery < 80) {
      setQSeq((n) => n + 1)
      setCurrent({ topic, reason: current.reason, question: generateQuestion(topic.id, row.difficulty) })
      setView('question')
    } else {
      advance(topics, updated)
    }
  }

  async function advanceDiagnostic() {
    const next = diagnostic.index + 1
    if (next >= diagnostic.queue.length) {
      await supabase.from('players').update({ diagnostic_complete: true }).eq('id', state.player.id)
      const reloaded = await loadPlayer()
      setDiagnostic(null)
      setState(reloaded)
      advance(topics, reloaded)
      return
    }
    const item = diagnostic.queue[next]
    setDiagnostic({ ...diagnostic, index: next })
    setQSeq((n) => n + 1)
    setCurrent({
      topic: item.topic,
      reason: 'diagnostic',
      question: generateQuestion(item.topic.id, item.difficulty)
    })
    setView('question')
  }

  /* -------------------------- boss battle --------------------------- */

  // Six of the hardest questions, drawn only from topics he has actually
  // mastered, no hints, big XP. Once a week, and only once he has enough
  // mastered to make it a real test.
  function startBoss() {
    const { masteredIds } = bossReady({ mastery: state.mastery, topics, battles })
    const pool = topics.filter((t) => masteredIds.includes(t.id))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const queue = Array.from({ length: BOSS_LENGTH }, (_, i) => {
      const topic = shuffled[i % shuffled.length]
      return { topic, question: generateQuestion(topic.id, 3) }
    })
    setBoss({ queue, index: 0, score: 0 })
    setQSeq((n) => n + 1)
    setCurrent({ topic: queue[0].topic, reason: 'boss', question: queue[0].question })
    setView('question')
  }

  async function advanceBoss() {
    const score = boss.score + (lastResult.current ? 1 : 0)
    const next = boss.index + 1

    if (next < boss.queue.length) {
      const item = boss.queue[next]
      setBoss({ ...boss, index: next, score })
      setQSeq((n) => n + 1)
      setCurrent({ topic: item.topic, reason: 'boss', question: item.question })
      setView('question')
      return
    }

    const passed = score >= BOSS_PASS
    const xp = passed ? BOSS_XP : Math.round((BOSS_XP * score) / boss.queue.length / 2)
    await recordBattle({
      playerId: state.player.id,
      topicIds: [...new Set(boss.queue.map((q) => q.topic.id))],
      score,
      total: boss.queue.length,
      passed,
      xp
    })
    const refreshed = await loadBattles(state.player.id)
    setBattles(refreshed)
    setSessionXp((v) => v + xp)
    await awardXp(xp)

    // Celebrate any boss badge straight away rather than at bedtime.
    const earned = await grantNewUnlocks(state.player.id, state.unlocks ?? [], {
      player: state.player,
      level: levelFromXp(state.player.xp_total).level,
      mastered: state.mastery.filter(isMastered).length,
      bestRun,
      bossWins: refreshed.filter((b) => b.passed).length
    })
    if (earned.length) {
      setPrizes(earned)
      setState((s) => ({
        ...s,
        unlocks: [...(s.unlocks ?? []), ...earned.map((r) => ({ item_code: r.code, item_type: r.type }))]
      }))
    }

    setBoss({ ...boss, index: next, score, done: true, passed, xp })
    setView('bossdone')
  }

  async function finishDay(updated = state) {
    const { streak, freezes } = streakAfterPlay(updated.player)
    // XP is already banked per answer by awardXp, so only the streak and the
    // session close out here.
    await supabase.from('players').update({
      streak_current: streak,
      streak_longest: Math.max(streak, updated.player.streak_longest),
      streak_freezes: freezes,
      last_played_on: todayISO()
    }).eq('id', updated.player.id)

    await supabase.from('sessions').update({
      xp_earned: sessionXp,
      goal_met: true,
      ended_at: new Date().toISOString()
    }).eq('id', sessionId)

    const player = { ...updated.player, streak_current: streak, xp_total: xpRef.current }
    await settleRewards({ ...updated, player })
    setState({ ...updated, player })
    setView('done')
  }

  // Works out everything he has earned and celebrates whatever is new.
  // Called at the end of a day and after a boss battle.
  async function settleRewards(next) {
    // Level ups are announced as they happen, in submitAnswer. This only
    // settles the unlocks, which depend on the finished day's streak.
    const earned = await grantNewUnlocks(next.player.id, next.unlocks ?? [], {
      player: next.player,
      level: levelFromXp(next.player.xp_total).level,
      mastered: (next.mastery ?? []).filter(isMastered).length,
      bestRun,
      bossWins: battles.filter((b) => b.passed).length
    })
    if (earned.length) {
      setPrizes(earned)
      next.unlocks = [
        ...(next.unlocks ?? []),
        ...earned.map((r) => ({ item_code: r.code, item_type: r.type }))
      ]
    }
  }

  const lastResult = useRef(false)

  /* ---------------------------- render ------------------------------ */

  if (!booted) return <Splash />
  if (view === 'auth') return <Auth onDone={boot} />
  if (!state) return <Splash />

  const goal = state.player.daily_xp_goal
  const pct = Math.min(100, Math.round((sessionXp / goal) * 100))
  const lvl = levelFromXp(state.player.xp_total)
  const bossState = bossReady({ mastery: state.mastery, topics, battles })

  return (
    <div className={`mx-auto flex h-full w-full max-w-3xl flex-col px-4 pb-4 lg:max-w-[1400px] lg:px-8 ${flash ? `flash-${flash}` : ''}`}>
      {!online && (
        <div className="mb-2 rounded-sm bg-fault/20 px-3 py-2 font-hud text-[10px] text-fault">
          NO CONNECTION. YOUR ANSWERS WILL NOT SAVE UNTIL IT IS BACK.
        </div>
      )}
      <Hud
        player={state.player}
        level={lvl}
        sessionXp={sessionXp}
        goal={goal}
        pct={pct}
        run={run}
        onParent={() => setView(view === 'parent' ? 'question' : 'parent')}
        onProgress={() => setView(view === 'progress' ? 'question' : 'progress')}
      />

      {view === 'parent' && <ParentSummary state={state} topics={topics} onBack={() => setView('question')} />}

      {view === 'progress' && (
        <Progress
          state={state}
          topics={topics}
          level={lvl}
          battles={battles}
          bossState={bossState}
          onBoss={startBoss}
          onBack={() => setView(current?.question ? 'question' : 'done')}
        />
      )}

      {view === 'lesson' && (
        <Lesson topic={current.topic} onStart={finishLesson} />
      )}

      {view === 'question' && current?.question && (
        <Question
          key={qSeq}
          topic={current.topic}
          question={current.question}
          reason={boss ? 'boss' : diagnostic ? 'diagnostic' : current.reason}
          diagnosticProgress={
            boss ? `${boss.index + 1} of ${boss.queue.length}`
              : diagnostic ? `${diagnostic.index + 1} of ${diagnostic.queue.length}` : null
          }
          noHints={Boolean(boss)}
          onSubmit={async (payload) => {
            const res = await submitAnswer(payload)
            lastResult.current = res.correct
            return res
          }}
          onNext={nextQuestion}
          pad={pad}
          setPad={setPad}
        />
      )}

      {view === 'bossdone' && (
        <BossResult
          boss={boss}
          onBack={() => { setBoss(null); advance(topics, state) }}
        />
      )}

      {view === 'done' && (
        <DayComplete
          player={state.player}
          xp={sessionXp}
          level={lvl}
          bossReady={bossState.ready}
          onBoss={startBoss}
          onProgress={() => setView('progress')}
        />
      )}

      {levelUp && <LevelUpToast level={levelUp} onClose={() => setLevelUp(null)} />}
      {!levelUp && prizes.length > 0 && <PrizeToast prizes={prizes} onClose={() => setPrizes([])} />}
    </div>
  )
}

/* ============================== screens ============================== */

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-display text-4xl text-ember">Heating the forge...</p>
    </div>
  )
}

function Auth({ onDone }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function go() {
    setError(null)
    setBusy(true)
    const res = await enterForge()
    setBusy(false)
    if (res.error) return setError(res.error)
    onDone()
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="font-display text-6xl leading-none text-ember">Number Forge</h1>
        <p className="mt-2 font-hud text-[11px] tracking-tight text-chalk/50">
          SUMMER TRAINING // YEAR 6 TO YEAR 7
        </p>
      </div>

      {error && <p className="font-hud text-[11px] text-fault">{error}</p>}

      <button
        onClick={go}
        disabled={busy}
        className="pixel-edge-hot pixel-press rounded-sm bg-ember px-6 py-5 font-display text-4xl text-slate-deep disabled:opacity-60"
      >
        {busy ? 'Lighting the forge...' : 'Start'}
      </button>
    </div>
  )
}

function Hud({ player, level, sessionXp, goal, pct, run, onParent, onProgress }) {
  const combo = comboWord(run)
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 bg-slate-deep/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none text-ember">Number Forge</p>
          <button onClick={onProgress} className="font-hud text-[10px] text-chalk/45 hover:text-quench">
            {player.display_name.toUpperCase()} // LVL {level.level} {level.rank.toUpperCase()}
          </button>
        </div>
        <div className="flex items-center gap-4">
          {combo && (
            <span className="combo-pop hidden font-display text-xl text-forge sm:inline">{combo}</span>
          )}
          <Stat label="STREAK" value={`${player.streak_current}d`} tone="text-forge" />
          <Stat label="XP TODAY" value={`${sessionXp}/${goal}`} tone="text-quench" />
          <button onClick={onParent} className="font-hud text-[10px] text-chalk/40 hover:text-chalk">DAD</button>
        </div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-sm bg-slate-stone">
        <div
          className="bar-grow h-full bg-quench transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Level progress sits under the daily goal so both journeys are visible. */}
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-slate-stone">
          <div className="h-full bg-ember/70 transition-[width] duration-500" style={{ width: `${level.pct}%` }} />
        </div>
        <span className="font-hud text-[9px] text-chalk/35">{level.into}/{level.need} TO LVL {level.level + 1}</span>
      </div>
    </header>
  )
}

/* ------------------------- progress screen ------------------------- */

function Progress({ state, topics, level, battles, bossState, onBoss, onBack }) {
  const byId = {}
  for (const m of state.mastery) byId[m.topic_id] = m
  const owned = new Set((state.unlocks ?? []).map((u) => u.item_code))

  const done = topics.filter((t) => isMastered(byId[t.id]))
  const started = topics.filter((t) => byId[t.id]?.taught && !isMastered(byId[t.id]))
  const locked = topics.filter((t) => !byId[t.id]?.taught)
  const wins = battles.filter((b) => b.passed).length

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-3xl text-ember">Your forge</p>
        <button onClick={onBack} className="font-hud text-[10px] text-chalk/50 underline underline-offset-4">BACK</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="LEVEL" value={level.level} note={level.rank} />
        <Tile label="MASTERED" value={`${done.length}/${topics.length}`} note="topics conquered" />
        <Tile label="BEST STREAK" value={`${state.player.streak_longest}d`} note="days running" />
        <Tile label="BOSSES WON" value={wins} note={`${battles.length} fought`} />
      </div>

      {bossState.ready ? (
        <button
          onClick={onBoss}
          className="pixel-edge-hot pixel-press rounded-sm bg-fault/90 px-5 py-4 text-left font-display text-2xl text-slate-deep"
        >
          Boss battle ready
          <span className="mt-1 block font-hud text-[10px] tracking-tight text-slate-deep/70">
            {BOSS_LENGTH} HARD QUESTIONS, NO HINTS, {BOSS_XP} XP
          </span>
        </button>
      ) : (
        <p className="rounded-sm bg-slate-stone/60 px-4 py-3 font-hud text-[10px] text-chalk/45">
          {bossState.already
            ? 'BOSS ALREADY BEATEN THIS WEEK. A NEW ONE APPEARS ON MONDAY.'
            : `MASTER ${Math.max(0, 3 - done.length)} MORE TOPIC${3 - done.length === 1 ? '' : 'S'} TO UNLOCK A BOSS BATTLE.`}
        </p>
      )}

      <Group title="CONQUERED" tone="text-forge" items={done} byId={byId} />
      <Group title="IN PROGRESS" tone="text-quench" items={started} byId={byId} />
      <Group title="NOT STARTED" tone="text-chalk/40" items={locked} byId={byId} />

      <div>
        <p className="mb-2 font-hud text-[10px] text-rune">REWARDS</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REWARDS.map((r) => (
            <div
              key={r.code}
              className={`rounded-sm px-3 py-2 ${owned.has(r.code) ? 'bg-slate-stone' : 'bg-slate-stone/30'}`}
            >
              <p className={`font-hud text-[10px] ${owned.has(r.code) ? 'text-chalk' : 'text-chalk/30'}`}>
                {owned.has(r.code) ? r.name.toUpperCase() : 'LOCKED'}
              </p>
              <p className="font-hud text-[9px] text-chalk/35">{r.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Tile({ label, value, note }) {
  return (
    <div className="pixel-edge rounded-sm bg-slate-stone px-3 py-3">
      <p className="font-hud text-[9px] text-chalk/40">{label}</p>
      <p className="font-display text-3xl leading-tight text-chalk">{value}</p>
      <p className="font-hud text-[9px] text-chalk/35">{note}</p>
    </div>
  )
}

function Group({ title, tone, items, byId }) {
  if (!items.length) return null
  return (
    <div>
      <p className={`mb-2 font-hud text-[10px] ${tone}`}>{title} ({items.length})</p>
      <div className="flex flex-col gap-1">
        {items.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-sm bg-slate-stone/50 px-3 py-2">
            <span className="truncate font-hud text-[10px] text-chalk/70">{t.name}</span>
            <span className="shrink-0 font-hud text-[9px] text-chalk/35">
              {byId[t.id] ? `${Math.round(byId[t.id].mastery)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------- boss result --------------------------- */

function BossResult({ boss, onBack }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <p className={`font-display text-7xl leading-none ${boss.passed ? 'text-forge' : 'text-fault'}`}>
        {boss.passed ? 'Boss down' : 'Boss survived'}
      </p>
      <p className="font-display text-4xl text-quench">{boss.score} / {boss.queue.length}</p>
      <p className="font-hud text-[11px] text-chalk/60">
        {boss.passed
          ? `+${boss.xp} XP. THAT WAS THE HARD VERSION OF EVERYTHING YOU HAVE MASTERED.`
          : `+${boss.xp} XP. YOU NEEDED ${BOSS_PASS}. IT WILL BE BACK NEXT WEEK.`}
      </p>
      <button onClick={onBack} className="pixel-edge pixel-press mt-4 rounded-sm bg-slate-edge px-5 py-3 font-hud text-[11px]">
        BACK TO THE FORGE
      </button>
    </section>
  )
}

/* ----------------------------- toasts ------------------------------ */

function LevelUpToast({ level, onClose }) {
  return (
    <div className="toast-in fixed inset-x-0 bottom-6 z-30 mx-auto w-[min(92%,26rem)] rounded-sm bg-ember px-5 py-4 text-slate-deep shadow-xl">
      <p className="font-display text-3xl leading-none">Level {level.level}</p>
      <p className="font-hud text-[10px] tracking-tight">YOU ARE NOW A {level.rank.toUpperCase()}</p>
      <button onClick={onClose} className="mt-2 font-hud text-[10px] underline underline-offset-4">NICE</button>
    </div>
  )
}

function PrizeToast({ prizes, onClose }) {
  return (
    <div className="toast-in fixed inset-x-0 bottom-6 z-30 mx-auto w-[min(92%,26rem)] rounded-sm bg-forge px-5 py-4 text-slate-deep shadow-xl">
      <p className="font-hud text-[10px] tracking-tight">UNLOCKED</p>
      {prizes.map((p) => (
        <p key={p.code} className="font-display text-2xl leading-tight">{p.name}</p>
      ))}
      <button onClick={onClose} className="mt-2 font-hud text-[10px] underline underline-offset-4">GOT IT</button>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="text-right">
      <p className="font-hud text-[9px] text-chalk/40">{label}</p>
      <p className={`font-display text-2xl leading-none ${tone}`}>{value}</p>
    </div>
  )
}

function Lesson({ topic, onStart }) {
  const c = topicContent[topic.id]
  const [step, setStep] = useState(-1)

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
      <div className="lg:col-span-2">
        <p className="font-hud text-[10px] text-rune">NEW SKILL // {topic.strand.toUpperCase()}</p>
        <h2 className="font-display text-4xl leading-tight text-chalk lg:text-5xl">{topic.name}</h2>
      </div>

      <p className="text-lg leading-relaxed text-chalk/90">{c.idea}</p>

      <div className="pixel-edge rounded-sm bg-slate-stone p-4 lg:row-start-3">
        <p className="font-hud text-[10px] text-chalk/45">WHY IT MATTERS</p>
        <p className="mt-2 text-chalk/80">{c.why}</p>
      </div>

      <div className="pixel-edge rounded-sm bg-slate-stone p-4 lg:col-start-2 lg:row-start-2 lg:row-span-2">
        <p className="font-hud text-[10px] text-quench">WORKED EXAMPLE</p>
        <p className="mt-2 font-display text-3xl text-chalk">{c.worked.prompt}</p>

        <div className="mt-4 flex flex-col gap-3">
          {c.worked.steps.slice(0, step + 1).map((s, i) => (
            <div key={i} className="border-l-4 border-ember pl-3">
              <p className="text-chalk">{s.do}</p>
              <p className="text-sm text-chalk/55">{s.why}</p>
            </div>
          ))}
        </div>

        {step < c.worked.steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="pixel-edge pixel-press mt-4 rounded-sm bg-slate-edge px-4 py-2 font-hud text-[11px] text-chalk"
          >
            {step === -1 ? 'SHOW ME STEP 1' : 'NEXT STEP'}
          </button>
        ) : (
          <p className="mt-4 font-display text-2xl text-quench">Answer: {c.worked.answer}</p>
        )}
      </div>

      <div className="pixel-edge rounded-sm border-l-4 bg-slate-stone p-4 lg:col-span-2" style={{ borderLeftColor: '#ff4d6d' }}>
        <p className="font-hud text-[10px] text-fault">WATCH OUT</p>
        <p className="mt-2 text-chalk/85">{c.watchOut}</p>
      </div>

      <button
        onClick={onStart}
        disabled={step < c.worked.steps.length - 1}
        className="pixel-edge-hot pixel-press rounded-sm bg-ember px-6 py-4 font-display text-3xl text-slate-deep disabled:opacity-40 lg:col-span-2"
      >
        {step < c.worked.steps.length - 1 ? 'Work through the example first' : 'My turn'}
      </button>
    </section>
  )
}

function Question({ topic, question, reason, diagnosticProgress, noHints, onSubmit, onNext, pad, setPad }) {
  const [value, setValue] = useState('')
  const [hints, setHints] = useState(0)
  const [result, setResult] = useState(null)
  const started = useRef(Date.now())
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function check() {
    if (!value.trim() || result) return
    const res = await onSubmit({ given: value, hintsUsed: hints, timeMs: Date.now() - started.current })
    setResult(res)
  }

  const banner =
    reason === 'boss' ? `BOSS BATTLE // ${diagnosticProgress}`
      : reason === 'diagnostic' ? `WARM UP // ${diagnosticProgress}`
        : reason === 'review' ? 'BRINGING THIS BACK'
          : `${topic.strand.toUpperCase()} // ${DIFFICULTY_NAME[question.difficulty].toUpperCase()}`

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-6">
      {/* Left column on a laptop, top half on a tablet */}
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:w-[46%] lg:shrink-0">
        <div>
          <p className="font-hud text-[10px] text-rune">{banner}</p>
          <p className="font-hud text-[10px] text-chalk/40">{topic.name}</p>
        </div>

        <div className={`pixel-edge rounded-sm bg-slate-stone p-6 ${result && !result.correct ? 'shake' : ''}`}>
          <p className="font-display text-5xl leading-tight text-chalk lg:text-6xl">{question.prompt}</p>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (result ? onNext() : check())}
            placeholder="Your answer"
            disabled={Boolean(result)}
            className="pixel-edge min-w-0 flex-1 rounded-sm bg-slate-stone px-4 py-4 font-display text-3xl outline-none disabled:opacity-70"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            onClick={result ? onNext : check}
            className="pixel-edge-hot pixel-press shrink-0 rounded-sm bg-ember px-6 font-display text-2xl text-slate-deep"
          >
            {result ? 'Next' : 'Check'}
          </button>
        </div>

        <p className="hidden font-hud text-[9px] text-chalk/30 lg:block">
          PRESS ENTER TO CHECK, THEN ENTER AGAIN FOR THE NEXT ONE
        </p>

        {!result && !noHints && question.hints?.length > 0 && (
          <div>
            {hints < question.hints.length && (
              <button
                onClick={() => setHints(hints + 1)}
                className="font-hud text-[11px] text-chalk/50 underline underline-offset-4 hover:text-forge"
              >
                STUCK? TAKE A HINT (COSTS HALF THE XP)
              </button>
            )}
            {question.hints.slice(0, hints).map((h, i) => (
              <p key={i} className="mt-2 border-l-4 border-forge pl-3 text-chalk/80">{h}</p>
            ))}
          </div>
        )}

        {result && (
          <div className={`pixel-edge rounded-sm p-4 ${result.correct ? 'bg-quench/15' : 'bg-fault/15'}`}>
            <p className={`font-display text-3xl ${result.correct ? 'text-quench' : 'text-fault'}`}>
              {result.correct ? `Forged. +${result.xp} XP` : `Not this time. It was ${question.answer}`}
            </p>
            {result.slip && <p className="mt-2 text-chalk/85">{result.slip.fix}</p>}
            {!result.correct && !result.slip && (
              <p className="mt-2 text-chalk/70">Have another look at the worked example if you want it again.</p>
            )}
          </div>
        )}
      </div>

      {/* Workbench: full height beside the question on a laptop */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Scratchpad open={pad} onToggle={() => setPad(!pad)} />
      </div>
    </section>
  )
}

function DayComplete({ player, xp, level, bossReady, onBoss, onProgress }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <p className="font-display text-7xl leading-none text-forge">Day done</p>
      <p className="font-display text-4xl text-quench">+{xp} XP</p>
      <p className="font-hud text-[11px] text-chalk/60">
        {player.streak_current} DAY STREAK. LEVEL {level.level}, {level.rank.toUpperCase()}.
      </p>

      {bossReady && (
        <button
          onClick={onBoss}
          className="pixel-edge-hot pixel-press mt-2 rounded-sm bg-fault/90 px-6 py-4 font-display text-3xl text-slate-deep"
        >
          Boss battle
        </button>
      )}

      <button onClick={onProgress} className="pixel-edge pixel-press mt-2 rounded-sm bg-slate-edge px-5 py-3 font-hud text-[11px]">
        SEE YOUR FORGE
      </button>
      <p className="font-hud text-[10px] text-chalk/35">COME BACK TOMORROW TO KEEP THE STREAK.</p>
    </section>
  )
}

function ParentSummary({ state, topics, onBack }) {
  const rows = useMemo(() => {
    const map = {}
    for (const m of state.mastery) map[m.topic_id] = m
    return topics.map((t) => ({ topic: t, m: map[t.id] })).filter((r) => r.m?.taught)
  }, [state, topics])

  return (
    <section className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-chalk">Progress</h2>
        <button onClick={onBack} className="font-hud text-[11px] text-chalk/50">CLOSE</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card label="STREAK" value={`${state.player.streak_current} days`} />
        <Card label="BEST" value={`${state.player.streak_longest} days`} />
        <Card label="TOTAL XP" value={state.player.xp_total} />
      </div>

      <p className="font-hud text-[10px] text-chalk/40">TOPICS STARTED</p>
      {rows.length === 0 && <p className="text-chalk/60">Nothing yet. It fills up as he plays.</p>}
      {rows.map(({ topic, m }) => (
        <div key={topic.id} className="pixel-edge rounded-sm bg-slate-stone p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-chalk">{topic.name}</p>
            <p className="font-hud text-[10px] text-chalk/50">{DIFFICULTY_NAME[m.difficulty]}</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-slate-edge">
            <div
              className="h-full"
              style={{
                width: `${m.mastery}%`,
                background: m.mastery >= 80 ? '#38e8c8' : m.mastery >= 40 ? '#ffc341' : '#ff4d6d'
              }}
            />
          </div>
        </div>
      ))}
    </section>
  )
}

function Card({ label, value }) {
  return (
    <div className="pixel-edge rounded-sm bg-slate-stone p-3 text-center">
      <p className="font-hud text-[9px] text-chalk/40">{label}</p>
      <p className="font-display text-3xl text-forge">{value}</p>
    </div>
  )
}
