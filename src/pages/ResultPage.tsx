import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import { GachaPage } from './GachaPage'
import { PixelCharacter } from '../components/PixelCharacter'
import { ALL_CHARACTERS } from '../data/characters'
import type { AppPage } from '../App'

interface Props { onNavigate: (p: AppPage) => void }

export function ResultPage({ onNavigate }: Props) {
  const { currentSession, progress, clearSession, setSession } = useStore()
  const { saveProgress } = useFirebaseSync()
  const [evolved, setEvolved] = useState(false)
  const [showGacha, setShowGacha] = useState(false)
  const [pendingGacha, setPendingGacha] = useState(false)
  const [evolutions, setEvolutions] = useState<{ charId: string; newStage: number }[]>([])

  const score = currentSession?.score ?? 0
  const total = currentSession?.questions.length ?? 10
  const passed = score >= 8

  useEffect(() => {
    // Read the LIVE store progress (not the mount-time closure) so the wrong-word
    // updates the final quiz answer just wrote are preserved by this full-doc save.
    const p = useStore.getState().progress
    if (!passed || !p || !currentSession) return

    // Idempotency: if this study was already recorded today, don't apply it twice.
    // HomePage blocks a real 2nd same-day study, so this only guards against the
    // effect re-running on a remount (e.g. React StrictMode in dev) — without it,
    // the second run reads the already-incremented store and double-counts.
    if (p.lastStudyDate &&
      new Date(p.lastStudyDate).toDateString() === new Date().toDateString()) return

    // All active characters gain +1 day on a passing study.
    const activeIds = p.activeCharacterIds ?? (p.activeCharacterId ? [p.activeCharacterId] : [])
    const newCharacterDaysMap = { ...p.characterDaysMap }
    for (const charId of activeIds) {
      newCharacterDaysMap[charId] = (newCharacterDaysMap[charId] ?? 0) + 1
    }

    // Which characters crossed a 7-day evolution boundary this session?
    const evos: { charId: string; newStage: number }[] = []
    for (const charId of activeIds) {
      const prevStage = Math.min(Math.floor((p.characterDaysMap[charId] ?? 0) / 7), 3)
      const newStage = Math.min(Math.floor(newCharacterDaysMap[charId] / 7), 3)
      if (newStage > prevStage) evos.push({ charId, newStage })
    }

    const today = new Date()
    const lastDate = p.lastStudyDate

    // Streak (matches iOS): same calendar day → unchanged, yesterday → +1, else reset to 1.
    let newStreak: number
    if (!lastDate) {
      newStreak = 1
    } else {
      const last = new Date(lastDate)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (last.toDateString() === today.toDateString()) {
        newStreak = p.currentStreak            // already studied today → no change
      } else if (last.toDateString() === yesterday.toDateString()) {
        newStreak = p.currentStreak + 1
      } else {
        newStreak = 1
      }
    }
    const newTotal = p.totalDaysCompleted + 1

    const updated = {
      ...p,
      totalDaysCompleted: newTotal,
      currentStreak: newStreak,
      longestStreak: Math.max(p.longestStreak, newStreak),
      lastStudyDate: today.toISOString(),
      characterDaysMap: newCharacterDaysMap,
      // Dedupe: wrong words re-injected into the daily set are already studied,
      // so a plain append would accumulate duplicate ids in the persisted doc.
      studiedWordIds: Array.from(new Set([
        ...p.studiedWordIds,
        ...currentSession.words.map(w => w.word.id),
      ])),
    }

    saveProgress(updated)
    setEvolutions(evos)

    const willEvolve = evos.length > 0
    if (willEvolve) {
      setTimeout(() => setEvolved(true), 500)
    }

    // 7일마다 가챠. pendingGacha is set synchronously so the 완료 button is hidden
    // until the gacha appears — otherwise tapping 완료 during the delay would lose it.
    if (newTotal % 7 === 0) {
      setPendingGacha(true)
      setTimeout(() => setShowGacha(true), willEvolve ? 3000 : 2000)
    }
  }, [])

  if (showGacha) {
    return <GachaPage isFirstLaunch={false} onComplete={() => {
      clearSession()
      onNavigate('home')
    }} />
  }

  // Show the first character that evolved this session, else the main character.
  const activeIdsRender = progress?.activeCharacterIds ??
    (progress?.activeCharacterId ? [progress.activeCharacterId] : [])
  const displayCharId = evolutions[0]?.charId ?? activeIdsRender[0] ?? ''
  const displayChar = displayCharId
    ? ALL_CHARACTERS.find(c => c.id === displayCharId)
    : null
  const displayDays = progress?.characterDaysMap[displayCharId] ?? 0
  const displayStage = Math.min(Math.floor(displayDays / 7), 3)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', padding:'24px',
      background:'var(--bg)', gap:28, textAlign:'center' }}>

      <div style={{ fontSize:64 }}>{passed ? '🎉' : '😅'}</div>

      <div>
        <div style={{ fontSize:32, fontWeight:700, fontFamily:'monospace',
          color: passed ? 'var(--success)' : 'var(--fail)',
          marginBottom:8 }}>
          {passed ? '통과!' : '아쉬워요'}
        </div>
        <div style={{ fontSize:20, color:'var(--text-primary)' }}>
          {score} / {total} 정답
        </div>
      </div>

      {passed && displayChar && (
        <div className="card" style={{ width:'100%', maxWidth:280 }}>
          <div style={{ display:'flex', justifyContent:'center',
            transform: evolved ? 'scale(1.2)' : 'scale(1)',
            transition:'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <PixelCharacter characterId={displayChar.id} stage={displayStage} pixelSize={10} />
          </div>
          {evolutions.length > 0 && (
            <div style={{ marginTop:8 }}>
              {evolutions.map(({ charId }) => {
                const char = ALL_CHARACTERS.find(c => c.id === charId)
                return (
                  <div key={charId} style={{ fontSize:13, color:'var(--accent-secondary)',
                    fontWeight:700, marginTop:4, animation:'slideUp 0.4s ease-out' }}>
                    {char?.characterName} 진화! ⭐
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!passed && (
        <p style={{ color:'var(--text-secondary)', fontSize:14 }}>
          8개 이상 맞춰야 통과예요
        </p>
      )}

      <div style={{ width:'100%', maxWidth:320, display:'flex',
        flexDirection:'column', gap:12 }}>
        {passed ? (
          pendingGacha ? (
            <div style={{ color:'var(--accent-secondary)', fontWeight:700, textAlign:'center' }}>
              ✨ 새로운 동료가 찾아오고 있어요…
            </div>
          ) : (
            <button className="btn-primary" onClick={() => {
              clearSession()
              onNavigate('home')
            }}>완료</button>
          )
        ) : (
          <button className="btn-primary" style={{ background:'var(--accent)' }}
            onClick={() => {
              // Reset the session so the retry starts from question 1 (otherwise the
              // index sits at questions.length and the quiz renders blank).
              if (currentSession) {
                setSession({
                  ...currentSession,
                  currentQuestionIndex: 0,
                  score: 0,
                  questions: [...currentSession.questions].sort(() => Math.random() - 0.5),
                  phase: 'quiz',
                })
              }
              onNavigate('quiz')
            }}>
            다시 도전!
          </button>
        )}
      </div>
    </div>
  )
}
