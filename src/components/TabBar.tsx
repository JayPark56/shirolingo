import type { AppPage } from '../App'

interface Props {
  current: 'home' | 'collection' | 'wordbook'
  onNavigate: (p: AppPage) => void
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--accent)' : 'var(--text-secondary)'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

const CollectionIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--accent)' : 'var(--text-secondary)'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const WordbookIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--accent)' : 'var(--text-secondary)'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    <line x1="9" y1="7" x2="15" y2="7"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
  </svg>
)

export function TabBar({ current, onNavigate }: Props) {
  return (
    <div className="tab-bar">
      <button className={`tab-item ${current === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}>
        <HomeIcon active={current === 'home'} />
        <span>홈</span>
      </button>
      <button className={`tab-item ${current === 'wordbook' ? 'active' : ''}`}
        onClick={() => onNavigate('wordbook')}>
        <WordbookIcon active={current === 'wordbook'} />
        <span>단어장</span>
      </button>
      <button className={`tab-item ${current === 'collection' ? 'active' : ''}`}
        onClick={() => onNavigate('collection')}>
        <CollectionIcon active={current === 'collection'} />
        <span>컬렉션</span>
      </button>
    </div>
  )
}
