import type { AppPage } from '../App'

interface Props {
  current: 'home' | 'collection'
  onNavigate: (p: AppPage) => void
}

export function TabBar({ current, onNavigate }: Props) {
  return (
    <div className="tab-bar">
      <button className={`tab-item ${current === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}>
        <span style={{ fontSize:20 }}>🏠</span>
        <span>홈</span>
      </button>
      <button className={`tab-item ${current === 'collection' ? 'active' : ''}`}
        onClick={() => onNavigate('collection')}>
        <span style={{ fontSize:20 }}>⭐</span>
        <span>컬렉션</span>
      </button>
    </div>
  )
}
