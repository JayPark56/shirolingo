import { ALL_PIXEL_FRAMES } from '../data/pixelArt'

interface Props {
  characterId: string
  stage: number
  pixelSize?: number
  isLocked?: boolean
}

export function PixelCharacter({ characterId, stage, pixelSize = 8, isLocked = false }: Props) {
  const frames = ALL_PIXEL_FRAMES[characterId]
  const frame = frames?.[Math.min(stage, 3)] ?? frames?.[0]
  if (!frame) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, ${pixelSize}px)`, lineHeight: 0 }}>
      {frame.flat().map((color, i) => (
        <div
          key={i}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: color
              ? isLocked ? 'rgba(255,255,255,0.15)' : color
              : 'transparent',
          }}
        />
      ))}
    </div>
  )
}
