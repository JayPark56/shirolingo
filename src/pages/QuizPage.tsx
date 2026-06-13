import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { ProgressBar } from '../components/ProgressBar'
import type { AppPage } from '../App'

interface Props { onNavigate: (p: AppPage) => void }

export function QuizPage({ onNavigate }: Props) {
  const { currentSession, setSession } = useStore()
  const [answerState, setAnswerState] = useState<'idle'|'correct'|'wrong'>('idle')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (!currentSession) { onNavigate('home'); return }
    const q = currentSession.questions[currentSession.currentQuestionIndex]
    if (q?.type === 'audioChoice') speak(q.word.reading)
  }, [currentSession?.currentQuestionIndex])

  if (!currentSession) return null

  const { questions, currentQuestionIndex, score } = currentSession
  const question = questions[currentQuestionIndex]
  if (!question) return null

  const displayText = question.word.kanji ?? question.word.reading

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ja-JP'
    utter.rate = 0.8
    speechSynthesis.speak(utter)
  }

  function submitAnswer(answer: string) {
    if (answerState !== 'idle' || !currentSession) return
    const correct = answer.trim() === question.correctAnswer.trim()
    const newScore = correct ? score + 1 : score

    setAnswerState(correct ? 'correct' : 'wrong')

    setTimeout(() => {
      setAnswerState('idle')
      setInputValue('')

      const updated = {
        ...currentSession,
        score: newScore,
        currentQuestionIndex: currentQuestionIndex + 1,
      }

      if (currentQuestionIndex + 1 >= questions.length) {
        setSession({ ...updated, phase: 'result' })
        onNavigate('result')
      } else {
        setSession(updated)
      }
    }, 1500)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh',
      padding:'0 16px', background:'var(--bg)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', padding:'16px 0' }}>
        <button onClick={() => onNavigate('home')} style={{ background:'none',
          border:'none', color:'var(--text-secondary)', fontSize:20, cursor:'pointer' }}>
          ✕
        </button>
        <span style={{ color:'var(--accent-secondary)', fontWeight:700 }}>
          점수: {score}
        </span>
      </div>

      <ProgressBar value={currentQuestionIndex + 1} total={questions.length}
        color="var(--accent-secondary)" height={4} />

      <div style={{ flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', gap:20 }}>

        {/* Question prompt */}
        <div className="card" style={{ textAlign:'center' }}>
          {question.type === 'audioChoice' ? (
            <>
              <button onClick={() => speak(question.word.reading)}
                style={{ background:'none', border:'none', cursor:'pointer',
                  display:'flex', flexDirection:'column',
                  alignItems:'center', gap:8, margin:'0 auto' }}>
                <span style={{ fontSize:48, color:'var(--accent)' }}>🔊</span>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
                  탭하여 다시 듣기
                </span>
              </button>
              <div style={{ marginTop:12, fontSize:13,
                color:'var(--text-secondary)' }}>들은 단어를 고르세요</div>
            </>
          ) : question.type === 'meaningChoice' ? (
            <>
              <div style={{ fontSize:48, fontWeight:700,
                color:'var(--text-primary)' }}>{displayText}</div>
              <div style={{ fontSize:18, color:'var(--text-secondary)',
                marginTop:8 }}>{question.word.reading}</div>
              <button onClick={() => speak(question.word.reading)}
                style={{ background:'rgba(233,69,96,0.15)', border:'none',
                  color:'var(--accent)', borderRadius:20, padding:'6px 16px',
                  fontSize:13, cursor:'pointer', marginTop:12 }}>
                🔊 발음 듣기
              </button>
              <div style={{ fontSize:13, color:'var(--text-secondary)',
                marginTop:8 }}>뜻을 고르세요</div>
            </>
          ) : question.type === 'readingChoice' ? (
            <>
              <div style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)',
                lineHeight:1.4 }}>{question.word.meaning}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)',
                marginTop:12 }}>읽는 법을 고르세요</div>
            </>
          ) : question.type === 'readingInput' ? (
            <>
              <div style={{ fontSize:48, fontWeight:700,
                color:'var(--text-primary)' }}>{displayText}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)',
                marginTop:12 }}>히라가나로 읽기를 입력하세요</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)',
                lineHeight:1.4 }}>{question.word.meaning}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)',
                marginTop:12 }}>일본어로 입력하세요</div>
            </>
          )}
        </div>

        {/* Answer feedback */}
        {answerState !== 'idle' && (
          <div style={{ padding:'12px 16px', borderRadius:12, textAlign:'center',
            background: answerState === 'correct'
              ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
            color: answerState === 'correct' ? 'var(--success)' : 'var(--fail)',
            fontSize:14, fontWeight:600,
            animation:'slideUp 0.3s ease-out' }}>
            {answerState === 'correct'
              ? '✓ 정답!'
              : `✗ 정답: ${question.correctAnswer}`}
          </div>
        )}

        {/* Choices or input */}
        {question.choices.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {question.choices.map(choice => (
              <button key={choice}
                onClick={() => submitAnswer(choice)}
                disabled={answerState !== 'idle'}
                style={{
                  background: answerState !== 'idle'
                    ? choice === question.correctAnswer
                      ? 'rgba(76,175,80,0.25)'
                      : 'var(--card-bg)'
                    : 'var(--card-bg)',
                  border: `1px solid ${
                    answerState !== 'idle' && choice === question.correctAnswer
                      ? 'var(--success)'
                      : 'transparent'
                  }`,
                  borderRadius:12, padding:'16px 12px',
                  color:'var(--text-primary)', fontSize:15,
                  cursor: answerState === 'idle' ? 'pointer' : 'default',
                  fontWeight:500, textAlign:'center',
                  transition:'all 0.2s',
                }}>
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer(inputValue)}
              disabled={answerState !== 'idle'}
              placeholder="여기에 입력하세요"
              style={{ background:'var(--card-bg)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:12, padding:'16px', fontSize:18, color:'var(--text-primary)',
                textAlign:'center', outline:'none' }}
            />
            <button className="btn-primary"
              onClick={() => submitAnswer(inputValue)}
              disabled={!inputValue || answerState !== 'idle'}>
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
