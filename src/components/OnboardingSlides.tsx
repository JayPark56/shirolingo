import { useState, type ReactNode } from 'react'

interface Props {
  onComplete: () => void
}

interface Slide {
  icon: ReactNode
  title: string
  description: string
}

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const slides: Slide[] = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: '어서와요!',
    description: '매일 일본어 단어를 공부하고\n캐릭터를 모아보세요',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h10"/>
        <rect x="2" y="3" width="20" height="18" rx="2"/>
      </svg>
    ),
    title: '매일 10단어',
    description: 'N5부터 N1까지 각 레벨에서\n2개씩 총 10단어를 공부해요',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    title: '가챠 시스템',
    description: '처음 시작할 때, 그리고 7일마다\n새로운 캐릭터를 뽑을 수 있어요',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="#F5A623" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: '레어 캐릭터',
    description: '낮은 확률로 레어 캐릭터가 등장해요\n황금 테두리로 표시되며 매우 희귀해요',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>
      </svg>
    ),
    title: '캐릭터 강화',
    description: '7일 공부를 완료할 때마다\n캐릭터가 강화되고 진화해요\n28일이면 캐릭터 완성!',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        <line x1="9" y1="7" x2="15" y2="7"/>
        <line x1="9" y1="11" x2="13" y2="11"/>
      </svg>
    ),
    title: '틀린 단어장',
    description: '퀴즈에서 틀린 단어는 자동으로\n단어장에 저장돼요\n2번 연속 맞추면 자동 제거!',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
      </svg>
    ),
    title: '복습하기',
    description: '단어장에 10개가 쌓이면\n복습하기 버튼이 나타나요\n복습 후 깜짝 가챠가 등장할 수도 있어요',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
        stroke="var(--accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
    title: '시작할 준비 완료!',
    description: '이제 첫 번째 동료를 뽑아볼까요?',
  },
]

export function OnboardingSlides({ onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [animating, setAnimating] = useState(false)

  const slide = slides[currentIdx]
  const isLast = currentIdx === slides.length - 1

  function goNext() {
    if (animating) return
    if (isLast) {
      onComplete()
      return
    }
    setAnimating(true)
    setTimeout(() => {
      setCurrentIdx(i => i + 1)
      setAnimating(false)
    }, 200)
  }

  function goPrev() {
    if (animating || currentIdx === 0) return
    setAnimating(true)
    setTimeout(() => {
      setCurrentIdx(i => i - 1)
      setAnimating(false)
    }, 200)
  }

  function skipAll() {
    onComplete()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0,
      }}>
        {/* Skip button */}
        {!isLast && (
          <div style={{ width: '100%', display: 'flex',
            justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={skipAll} style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 13,
              cursor: 'pointer', padding: '4px 8px',
            }}>
              건너뛰기
            </button>
          </div>
        )}

        {/* Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 24,
          padding: '48px 32px 40px',
          width: '100%',
          textAlign: 'center',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          minHeight: 320,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          {/* Icon */}
          <div style={{
            width: 96, height: 96,
            background: 'rgba(233,69,96,0.08)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {slide.icon}
          </div>

          {/* Text */}
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
              fontFamily: 'Paperlogy, sans-serif',
            }}>
              {slide.title}
            </div>
            <div style={{
              fontSize: 14, color: 'var(--text-secondary)',
              lineHeight: 1.8, whiteSpace: 'pre-line',
              fontFamily: 'Paperlogy, sans-serif',
            }}>
              {slide.description}
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div style={{
          display: 'flex', gap: 8,
          marginTop: 24, marginBottom: 24,
        }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === currentIdx ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === currentIdx
                ? 'var(--accent)'
                : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', gap: 12, width: '100%',
        }}>
          {currentIdx > 0 && (
            <button onClick={goPrev} className="btn-secondary"
              style={{ flex: 1 }}>
              이전
            </button>
          )}
          <button
            onClick={goNext}
            className="btn-primary"
            style={{
              flex: 1,
              background: isLast
                ? 'linear-gradient(135deg, var(--accent), #FF6B9D)'
                : 'var(--accent)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            {isLast ? '시작하기' : (
              <>
                다음
                <ArrowIcon />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
