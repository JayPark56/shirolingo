import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import { TabBar } from '../components/TabBar'
import { ReviewQuiz } from '../components/ReviewQuiz'
import { GachaPage } from './GachaPage'
import { drawGacha } from '../hooks/useGacha'
import type { AppPage } from '../App'

interface Props { onNavigate: (p: AppPage) => void }

export function WordbookPage({ onNavigate }: Props) {
  const { progress } = useStore()
  const { saveProgress } = useFirebaseSync()
  const [showReview, setShowReview] = useState(false)
  const [surpriseGacha, setSurpriseGacha] = useState(false)

  if (!progress) return null

  const wrongWords = [...(progress.wrongWords ?? [])]
    .sort((a, b) => b.wrongCount - a.wrongCount)

  async function removeWord(wordId: string) {
    if (!progress) return
    const updated = {
      ...progress,
      wrongWords: (progress.wrongWords ?? []).filter(w => w.wordId !== wordId),
    }
    await saveProgress(updated)
  }

  // Surprise gacha (10% reward after a review quiz)
  if (surpriseGacha) {
    return (
      <div>
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          background: 'linear-gradient(135deg, #6B4FBB, #E94560)',
          padding: '12px 16px', textAlign: 'center', zIndex: 300,
          fontSize: 14, fontWeight: 700, color: 'white',
        }}>
          깜짝 가챠!
        </div>
        <GachaPage
          isFirstLaunch={false}
          isSurprise={true}
          onComplete={() => setSurpriseGacha(false)}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '16px 0', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Paperlogy, sans-serif', fontSize: 20,
          fontWeight: 700, color: 'white' }}>틀린 단어장</h2>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          {wrongWords.length === 0
            ? '틀린 단어가 없어요!'
            : `${wrongWords.length}개 · 2번 연속 맞추면 자동 제거`}
        </div>
      </div>

      {wrongWords.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '50vh', gap: 16 }}>
          <div style={{ fontSize: 48 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700,
            color: 'var(--text-primary)' }}>모두 외웠어요!</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)',
            textAlign: 'center', whiteSpace: 'pre-line' }}>
            틀린 단어가 없습니다{'\n'}오늘도 완벽하네요
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {wrongWords.map(ww => (
            <div key={ww.wordId} className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

              {/* Word info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700,
                  color: 'var(--text-primary)', marginBottom: 4 }}>
                  {ww.word.kanji ?? ww.word.reading}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)',
                  marginBottom: 4 }}>
                  {ww.word.reading}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {ww.word.meaning}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column',
                alignItems: 'flex-end', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--fail)',
                  fontWeight: 700 }}>
                  {ww.wrongCount}회 틀림
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  연속 {ww.consecutiveCorrect}/2 정답
                </div>
                <button
                  onClick={() => removeWord(ww.wordId)}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8, padding: '4px 10px', fontSize: 11,
                    color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  알았어요
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {wrongWords.length >= 10 && !showReview && (
        <button
          className="btn-primary"
          onClick={() => setShowReview(true)}
          style={{ marginTop: 24, marginBottom: 16 }}
        >
          복습하기 ({wrongWords.length}개 중 5개)
        </button>
      )}

      {showReview && (
        <ReviewQuiz
          wrongWords={wrongWords}
          onComplete={() => {
            setShowReview(false)
            // 10% surprise gacha reward — only if a draw is actually possible
            // (otherwise drawGacha returns null and the gacha would dead-end).
            if (Math.random() < 0.1 && drawGacha(progress.ownedCharacterIds) !== null) {
              setSurpriseGacha(true)
            }
          }}
          onClose={() => setShowReview(false)}
        />
      )}

      <TabBar current="wordbook" onNavigate={onNavigate} />
    </div>
  )
}
