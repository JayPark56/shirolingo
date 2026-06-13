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

  async function setActive(id: string) {
    if (!progress) return
    if (!progress.ownedCharacterIds.includes(id)) return
    await saveProgress({ ...progress, activeCharacterId: id })
  }

  const series = [...new Set(ALL_CHARACTERS.map(c => c.seriesName))]

  return (
    <div className="page">
      <div style={{ padding:'16px 0', marginBottom:8 }}>
        <h2 style={{ fontFamily:'monospace', fontSize:20,
          fontWeight:700, color:'white' }}>컬렉션</h2>
        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
          {owned.length} / {ALL_CHARACTERS.length} 획득
        </div>
      </div>

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
                const isActive = progress!.activeCharacterId === char.id
                const days = progress!.characterDaysMap[char.id] ?? 0
                const stage = Math.min(Math.floor(days / 7), 3)

                return (
                  <button key={char.id}
                    onClick={() => setActive(char.id)}
                    style={{
                      background: isActive
                        ? 'rgba(233,69,96,0.15)' : 'var(--card-bg)',
                      border: `${isActive ? 2 : 1}px solid ${
                        isActive ? 'var(--accent)' : 'transparent'
                      }`,
                      borderRadius:12, padding:10,
                      cursor: isOwned ? 'pointer' : 'default',
                      display:'flex', flexDirection:'column',
                      alignItems:'center', gap:6,
                    }}>
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
