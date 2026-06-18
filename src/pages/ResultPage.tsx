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

  const score = currentSession?.score ?? 0
  const total = currentSession?.questions.length ?? 10
  const passed = score >= 8

  useEffect(() => {
    // Read the LIVE store progress (not the mount-time closure) so the wrong-word
    // updates the final quiz answer just wrote are preserved by this full-doc save.
    const p = useStore.getState().progress
    if (!passed || !p || !currentSession) return

    const activeId = p.activeCharacterId
    const prevDays = p.characterDaysMap[activeId] ?? 0
    const prevStage = Math.min(Math.floor(prevDays / 7), 3)
    const newDays = prevDays + 1
    const newStage = Math.min(Math.floor(newDays / 7), 3)

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
      characterDaysMap: { ...p.characterDaysMap, [activeId]: newDays },
      // Dedupe: wrong words re-injected into the daily set are already studied,
      // so a plain append would accumulate duplicate ids in the persisted doc.
      studiedWordIds: Array.from(new Set([
        ...p.studiedWordIds,
        ...currentSession.words.map(w => w.word.id),
      ])),
    }

    saveProgress(updated)

    const willEvolve = newStage > prevStage
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

  const activeChar = progress
    ? ALL_CHARACTERS.find(c => c.id === progress.activeCharacterId)
    : null
  const days = progress?.characterDaysMap[progress?.activeCharacterId ?? ''] ?? 0
  const stage = Math.min(Math.floor(days / 7), 3)

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

      {passed && activeChar && (
        <div className="card" style={{ width:'100%', maxWidth:280 }}>
          <div style={{ display:'flex', justifyContent:'center',
            transform: evolved ? 'scale(1.2)' : 'scale(1)',
            transition:'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <PixelCharacter characterId={activeChar.id} stage={stage} pixelSize={10} />
          </div>
          {evolved && (
            <div style={{ color:'var(--accent-secondary)', fontWeight:700,
              fontSize:18, marginTop:12, animation:'slideUp 0.4s ease-out' }}>
              진화했다! ⭐
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
