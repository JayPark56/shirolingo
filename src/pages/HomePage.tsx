import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useWordDatabase } from '../hooks/useWordDatabase'
import { PixelCharacter } from '../components/PixelCharacter'
import { ProgressBar } from '../components/ProgressBar'
import { ALL_CHARACTERS } from '../data/characters'
import { TabBar } from '../components/TabBar'
import { ShareModal } from '../components/ShareModal'
import type { AppPage } from '../App'

interface Props {
  onNavigate: (p: AppPage) => void
  onShowHelp: () => void
}

export function HomePage({ onNavigate, onShowHelp }: Props) {
  const { progress } = useStore()
  const { ready } = useWordDatabase()
  const [showShare, setShowShare] = useState(false)

  if (!progress) return null

  const activeChar = ALL_CHARACTERS.find(c => c.id === progress.activeCharacterId)
  const days = progress.characterDaysMap[progress.activeCharacterId] ?? 0
  const stage = Math.min(Math.floor(days / 7), 3)
  const daysInStage = days % 7
  const totalDays = progress.totalDaysCompleted
  const evolutionLabel = activeChar?.evolutionLabels[stage] ?? ''

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', padding:'16px 0' }}>
        <h1 style={{ fontFamily:'monospace', fontSize:20, fontWeight:700,
          color:'white' }}>Shirolingo</h1>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ color:'var(--accent-secondary)', fontWeight:700 }}>
            {progress.currentStreak}일 연속
          </div>
          <button
            onClick={onShowHelp}
            style={{
              width:28, height:28, borderRadius:'50%',
              background:'rgba(255,255,255,0.08)',
              border:'1px solid rgba(255,255,255,0.15)',
              color:'var(--text-secondary)', fontSize:13, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Character card */}
      <div className="card" style={{ marginBottom:16, textAlign:'center' }}>
        {activeChar && (
          <>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <PixelCharacter characterId={activeChar.id} stage={stage} pixelSize={8} />
            </div>
            <div style={{ marginTop:12, fontFamily:'monospace', fontSize:14,
              fontWeight:700, color:'var(--text-primary)' }}>{evolutionLabel}</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
              {activeChar.seriesName} · {activeChar.characterName}
            </div>
            <div style={{ marginTop:12 }}>
              <ProgressBar value={daysInStage} total={7} color="var(--accent)" />
            </div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:6 }}>
              {daysInStage}/7일 · 총 {days}일
            </div>
          </>
        )}
      </div>

      {/* Daily study card */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:16 }}>
          <span style={{ fontWeight:700, color:'var(--text-primary)' }}>오늘의 학습</span>
          <span style={{ fontSize:12, color:'var(--accent-secondary)',
            background:'rgba(245,166,35,0.15)', padding:'3px 10px',
            borderRadius:20, fontWeight:700 }}>{totalDays + 1}일차</span>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {(['n5','n4','n3','n2','n1'] as const).map(level => (
            <div key={level} style={{ flex:1, textAlign:'center',
              background:`color-mix(in srgb, var(--${level}) 15%, transparent)`,
              borderRadius:8, padding:'8px 0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:`var(--${level})` }}>
                {level.toUpperCase()}
              </div>
              <div style={{ fontSize:12, fontWeight:700,
                color:'var(--text-primary)' }}>2</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:12,
          color:'var(--text-secondary)', marginBottom:16 }}>총 10단어</div>

        <button
          className="btn-primary"
          onClick={() => onNavigate('study')}
          disabled={!ready}
        >
          {ready ? '오늘 공부 시작하기' : '단어 불러오는 중...'}
        </button>

        <button
          onClick={() => setShowShare(true)}
          style={{
            background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 700,
            width: '100%',
            cursor: 'pointer',
            marginTop: 12,
            fontFamily: 'Paperlogy, sans-serif',
          }}
        >
          마구 마구 자랑하기
        </button>
      </div>

      <TabBar current="home" onNavigate={onNavigate} />

      {showShare && (
        <ShareModal
          progress={progress}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
