import { useStore } from '../store/useStore'
import { ALL_CHARACTERS } from '../data/characters'
import { PixelCharacter } from '../components/PixelCharacter'
import { ProgressBar } from '../components/ProgressBar'
import { TabBar } from '../components/TabBar'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import type { AppPage } from '../App'

interface Props { onNavigate: (p: AppPage) => void }

export function CollectionPage({ onNavigate }: Props) {
  const { progress } = useStore()
  const { saveProgress } = useFirebaseSync()

  if (!progress) return null

  const owned = progress.ownedCharacterIds
  const activeIds = progress.activeCharacterIds ??
    (progress.activeCharacterId ? [progress.activeCharacterId] : [])

  async function toggleActive(id: string) {
    if (!progress) return
    const currentActive = progress.activeCharacterIds ??
      (progress.activeCharacterId ? [progress.activeCharacterId] : [])

    let newActive: string[]
    if (currentActive.includes(id)) {
      if (currentActive.length === 1) return            // always keep at least one active
      newActive = currentActive.filter(a => a !== id)   // remove from active (still owned)
    } else {
      if (currentActive.length >= 5) return             // slots full
      newActive = [...currentActive, id]
    }

    await saveProgress({
      ...progress,
      activeCharacterIds: newActive,
      activeCharacterId: newActive[0] ?? '',
    })
  }

  const series = [...new Set(ALL_CHARACTERS.map(c => c.seriesName))]

  return (
    <div className="page">
      <div style={{ padding:'16px 0', marginBottom:8 }}>
        <h2 style={{ fontFamily:'monospace', fontSize:20,
          fontWeight:700, color:'white' }}>컬렉션</h2>
        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
          {owned.length} / {ALL_CHARACTERS.length} 획득 · 육성 슬롯 {activeIds.length}/5
        </div>
      </div>

      {activeIds.length >= 5 && (
        <div style={{ padding:'10px 16px', marginBottom:16,
          background:'rgba(245,166,35,0.1)',
          border:'1px solid rgba(245,166,35,0.2)',
          borderRadius:12, fontSize:12,
          color:'var(--accent-secondary)', textAlign:'center', lineHeight:1.6 }}>
          육성 슬롯이 가득 찼어요 (5/5)<br/>
          탭하여 슬롯에서 제거할 수 있어요
        </div>
      )}

      {series.map(seriesName => {
        const chars = ALL_CHARACTERS.filter(c => c.seriesName === seriesName)
        return (
          <div key={seriesName} style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700,
              color:'var(--text-secondary)', marginBottom:12,
              paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {seriesName}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {chars.map(char => {
                const isOwned = owned.includes(char.id)
                const isActive = activeIds.includes(char.id)
                const activeIndex = activeIds.indexOf(char.id)
                const slotsFull = !isActive && activeIds.length >= 5  // owned but no free slot
                const days = progress!.characterDaysMap[char.id] ?? 0
                const stage = Math.min(Math.floor(days / 7), 3)

                return (
                  <button key={char.id}
                    onClick={() => {
                      if (!isOwned) return
                      if (slotsFull) return
                      toggleActive(char.id)
                    }}
                    style={{
                      position:'relative',
                      background: isActive
                        ? 'rgba(233,69,96,0.15)' : 'var(--card-bg)',
                      border: `${isActive ? 2 : 1}px solid ${
                        isActive ? 'var(--accent)' : 'transparent'
                      }`,
                      borderRadius:12, padding:10,
                      opacity: isOwned && slotsFull ? 0.45 : 1,
                      cursor: isOwned && !slotsFull ? 'pointer' : 'default',
                      display:'flex', flexDirection:'column',
                      alignItems:'center', gap:6,
                    }}>
                    {isActive && (
                      <div style={{ position:'absolute', top:6, right:6,
                        width:16, height:16, borderRadius:'50%',
                        background:'var(--accent)', fontSize:9, fontWeight:700,
                        color:'white', display:'flex',
                        alignItems:'center', justifyContent:'center' }}>
                        {activeIndex + 1}
                      </div>
                    )}
                    <PixelCharacter
                      characterId={char.id}
                      stage={isOwned ? stage : 0}
                      pixelSize={5}
                      isLocked={!isOwned}
                    />
                    <div style={{ fontSize:11, fontWeight:700,
                      color: isOwned ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontFamily:'monospace' }}>
                      {char.characterName}
                    </div>
                    {isOwned ? (
                      <>
                        <ProgressBar value={days % 7} total={7}
                          color={isActive ? 'var(--accent)' : 'var(--text-secondary)'}
                          height={3} />
                        <div style={{ fontSize:9, color:'var(--text-secondary)' }}>
                          {days}/28일
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize:14, color:'var(--text-secondary)' }}>🔒</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <TabBar current="collection" onNavigate={onNavigate} />
    </div>
  )
}
