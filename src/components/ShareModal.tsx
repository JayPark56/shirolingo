import { useState } from 'react'
import emailjs from '@emailjs/browser'
import type { UserProgress } from '../types'
import { ALL_CHARACTERS } from '../data/characters'

interface Props {
  progress: UserProgress
  onClose: () => void
}

const SERVICE_ID = 'service_dpiptvs'
const TEMPLATE_ID = 'template_p6qshwm'
const PUBLIC_KEY = 'SGXQOu6o5-5B9paTD'

export function ShareModal({ progress, onClose }: Props) {
  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Build auto-generated message content
  const ownedCount = progress.ownedCharacterIds.length
  const activeChar = ALL_CHARACTERS.find(c => c.id === progress.activeCharacterId)
  const days = progress.characterDaysMap[progress.activeCharacterId] ?? 0
  const stage = Math.min(Math.floor(days / 7), 3)
  const evolutionLabel = activeChar?.evolutionLabels[stage] ?? ''
  const streak = progress.currentStreak
  const totalDays = progress.totalDaysCompleted

  const stats = [
    { label: '연속 학습', value: `${streak}일` },
    { label: '총 공부일', value: `${totalDays}일` },
    { label: '보유 캐릭터', value: `${ownedCount}개` },
    { label: '현재 캐릭터', value: `${activeChar?.characterName ?? ''} (${evolutionLabel})` },
    { label: '시리즈', value: activeChar?.seriesName ?? '' },
  ]

  const autoMessage = stats.map(s => `${s.label}: ${s.value}`).join('\n')

  async function handleSend() {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요!')
      return
    }
    setSending(true)
    setError('')
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          nickname: nickname.trim(),
          message: autoMessage,
        },
        PUBLIC_KEY
      )
      setSent(true)
    } catch {
      setError('전송에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--card-bg)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 24px 48px',
        zIndex: 201,
        animation: 'slideUp 0.3s ease-out',
      }}>
        {sent ? (
          // Success state
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: 8 }}>
              자랑 완료!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)',
              marginBottom: 24 }}>
              열심히 공부하는 모습이 멋져요!
            </div>
            <button className="btn-primary" onClick={onClose}>닫기</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700,
                color: 'var(--text-primary)' }}>
                마구 마구 자랑하기
              </h3>
              <button onClick={onClose} style={{ background: 'none',
                border: 'none', color: 'var(--text-secondary)',
                fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Auto-generated content preview */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12, padding: 16, marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)',
                marginBottom: 12, fontWeight: 600 }}>자랑 내용 미리보기</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#F5A623' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nickname input */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginBottom: 8 }}>닉네임</div>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '14px 16px',
                  fontSize: 15, color: 'var(--text-primary)',
                  outline: 'none', fontFamily: 'Paperlogy, sans-serif',
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--fail)',
                marginBottom: 12 }}>{error}</div>
            )}

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={sending}
              style={{ background: 'linear-gradient(135deg, var(--accent), #FF6B9D)' }}
            >
              {sending ? '전송 중...' : '자랑하기!'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
