interface Props {
  value: number
  total: number
  color?: string
  height?: number
}

export function ProgressBar({ value, total, color = 'var(--accent)', height = 6 }: Props) {
  const pct = Math.min(value / total, 1) * 100
  return (
    <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:4,
      height, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color,
        borderRadius:4, transition:'width 0.3s ease' }} />
    </div>
  )
}
