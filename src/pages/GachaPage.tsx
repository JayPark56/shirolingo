import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import { drawGacha } from '../hooks/useGacha'
import { PixelCharacter } from '../components/PixelCharacter'
import { hapticMedium } from '../utils/haptics'
import type { GachaResult } from '../types'

type RevealPhase = 'idle' | 'shaking' | 'flashing' | 'paused' | 'flipping' | 'revealed' | 'done'

interface Props {
  isFirstLaunch: boolean
  isSurprise?: boolean
  onComplete: () => void
}

export function GachaPage({ isFirstLaunch, isSurprise = false, onComplete }: Props) {
  const { progress } = useStore()
  const { saveProgress } = useFirebaseSync()
  const [result, setResult] = useState<GachaResult | null>(null)
  const [phase, setPhase] = useState<RevealPhase>('idle')
  const [rerollUsed, setRerollUsed] = useState(false)
  const [showRare, setShowRare] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Draw once progress has hydrated (it may be null at first mount while the
  // Firestore snapshot loads — drawing in a []-effect would leave a blank page).
  useEffect(() => {
    if (progress && !result) {
      const r = drawGacha(progress.ownedCharacterIds)
      // Pool empty (every character already owned) — exit instead of a blank dead-end.
      if (r === null) { onComplete(); return }
      setResult(r)
    }
  }, [progress])

  function handleCardTap() {
    if (phase !== 'idle' || !result) return
    hapticMedium()
    playRevealSequence(result)
  }

  function playRevealSequence(drawnResult: GachaResult) {
    // Stage 1: Shake
    setPhase('shaking')
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50])

    setTimeout(() => {
      // Stage 2: Flash
      setPhase('flashing')
      if (navigator.vibrate) navigator.vibrate(100)

      setTimeout(() => {
        // Stage 3: Pause
        setPhase('paused')

        setTimeout(() => {
          // Stage 4: Flip
          setPhase('flipping')

          setTimeout(() => {
            // Stage 5: Revealed
            setPhase('revealed')
            if (navigator.vibrate) navigator.vibrate([0, 100, 200])

            if (drawnResult.isRare) {
              setTimeout(() => {
                setShowRare(true)
                if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
              }, 300)
            }

            setTimeout(() => setPhase('done'), 800)
          }, 400)
        }, 400)
      }, 300)
    }, 1200)
  }

  function handleReroll() {
    if (!progress) return
    setRerollUsed(true)
    setShowRare(false)
    setPhase('idle')
    const r = drawGacha(progress.ownedCharacterIds)
    setResult(r)
    if (r) setTimeout(() => playRevealSequence(r), 100)
  }

  async function handleConfirm() {
    if (!result || !progress) return
    const currentActive = progress.activeCharacterIds ??
      (progress.activeCharacterId ? [progress.activeCharacterId] : [])

    // Add to an active training slot if under 5; otherwise it just joins the collection.
    const newActive = currentActive.includes(result.characterId)
      ? currentActive
      : currentActive.length < 5
        ? [...currentActive, result.characterId]
        : currentActive

    const updated = {
      ...progress,
      ownedCharacterIds: progress.ownedCharacterIds.includes(result.characterId)
        ? progress.ownedCharacterIds
        : [...progress.ownedCharacterIds, result.characterId],
      activeCharacterIds: newActive,
      activeCharacterId: newActive[0] ?? result.characterId,
    }
    await saveProgress(updated)
    onComplete()
  }

  if (!result) return null

  const isFlipped = ['flipping', 'revealed', 'done'].includes(phase)
  const isFlipping = phase === 'flipping'
  const isShaking = phase === 'shaking'
  const isFlashing = phase === 'flashing'
  const isPaused = phase === 'paused'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', padding:'24px 24px',
      background:'var(--bg)', gap:32 }}>

      <h2 style={{ color:'var(--text-primary)', fontFamily:'monospace',
        fontSize:20, fontWeight:700, textAlign:'center' }}>
        {isSurprise ? '깜짝 가챠!' : isFirstLaunch ? '첫 번째 동료를 뽑아보세요!' : '새로운 동료 등장!'}
      </h2>

      {/* Flash overlay */}
      {isFlashing && (
        <div style={{ position:'fixed', inset:0, background:'white',
          animation:'flash 0.3s ease-out', pointerEvents:'none', zIndex:50 }} />
      )}

      {/* Card */}
      <div style={{ perspective: 1000, position:'relative' }}>
        {/* Rare particles */}
        {(isPaused || isFlipped) && result.isRare && (
          <div style={{ position:'absolute', inset:0, zIndex:10, pointerEvents:'none' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                position:'absolute',
                top:'50%', left:'50%',
                width:8, height:8,
                borderRadius:'50%',
                background:'#F5A623',
                transform: `rotate(${i * 45}deg) translateX(80px)`,
                animation: `particleBurst 0.8s ease-out ${i * 0.05}s forwards`,
              }} />
            ))}
          </div>
        )}

        <div
          ref={cardRef}
          onClick={handleCardTap}
          style={{
            width: 220,
            height: 300,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: isFlipping ? 'transform 0.4s ease-in-out' : 'none',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            animation: isShaking
              ? 'shake 1.2s ease-in-out'
              : phase === 'idle'
              ? 'bob 2s ease-in-out infinite'
              : 'none',
            cursor: phase === 'idle' ? 'pointer' : 'default',
            filter: isPaused
              ? `drop-shadow(0 0 20px ${result.isRare ? '#F5A623' : 'var(--accent)'})`
              : 'none',
          }}
        >
          {/* Front face */}
          <div style={{
            position:'absolute', inset:0,
            backfaceVisibility:'hidden',
            WebkitBackfaceVisibility:'hidden',
            background:'linear-gradient(135deg, var(--card-bg), #16213E)',
            borderRadius:20,
            border:`2px solid var(--accent)`,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:16,
          }}>
            <div style={{ fontSize:64, fontWeight:900, fontFamily:'monospace',
              color:'var(--accent)' }}>?</div>
            {phase === 'idle' && (
              <div style={{ color:'var(--text-secondary)', fontSize:13,
                animation:'bob 1.5s ease-in-out infinite' }}>
                탭하여 공개
              </div>
            )}
          </div>

          {/* Back face */}
          <div style={{
            position:'absolute', inset:0,
            backfaceVisibility:'hidden',
            WebkitBackfaceVisibility:'hidden',
            transform:'rotateY(180deg)',
            background: result.isRare
              ? 'linear-gradient(135deg, #2D1B00, var(--card-bg))'
              : 'linear-gradient(135deg, var(--card-bg), #16213E)',
            borderRadius:20,
            border:`${result.isRare ? 3 : 2}px solid ${result.isRare ? '#F5A623' : 'var(--accent)'}`,
            animation: result.isRare && phase === 'revealed' ? 'rareShine 1.5s ease-in-out infinite' : 'none',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:12,
            padding:20,
          }}>
            <div style={{ fontSize:11, color:'var(--text-secondary)',
              background:'rgba(255,255,255,0.08)', padding:'3px 10px',
              borderRadius:6, fontWeight:700 }}>
              {result.seriesName}
            </div>
            <PixelCharacter characterId={result.characterId} stage={0} pixelSize={9} />
            <div style={{ color:'var(--text-primary)', fontSize:20,
              fontWeight:700, fontFamily:'monospace',
              animation: phase === 'revealed' ? 'slideUp 0.4s ease-out' : 'none' }}>
              {result.characterName}
            </div>
            {result.isRare && (
              <div style={{ color:'#F5A623', fontSize:13, fontWeight:900 }}>⭐ RARE</div>
            )}
          </div>
        </div>
      </div>

      {/* RARE effect */}
      {showRare && (
        <div style={{ animation:'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
          textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:900, fontFamily:'monospace',
            background:'linear-gradient(90deg,#F5A623,#FFD54F)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            textShadow:'none' }}>
            ✨ RARE ✨
          </div>
        </div>
      )}

      {/* Buttons */}
      {phase === 'done' && (
        <div style={{ width:'100%', maxWidth:320, display:'flex',
          flexDirection:'column', gap:12, animation:'slideUp 0.4s ease-out' }}>
          <button className="btn-primary" onClick={handleConfirm}>
            이 캐릭터로 시작!
          </button>
          {!rerollUsed && !isSurprise && (
            <button className="btn-secondary" onClick={handleReroll}>
              다시 뽑기 (1회)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
