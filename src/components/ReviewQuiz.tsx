import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useFirebaseSync } from '../hooks/useFirebaseSync'
import { ProgressBar } from './ProgressBar'
import type { WrongWord, QuizQuestion } from '../types'
import { WordDatabase } from '../hooks/useWordDatabase'

interface Props {
  wrongWords: WrongWord[]
  onComplete: (correctCount: number) => void
  onClose: () => void
}

export function ReviewQuiz({ wrongWords, onComplete, onClose }: Props) {
  const { progress } = useStore()
  const { saveProgress } = useFirebaseSync()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [answerState, setAnswerState] = useState<'idle'|'correct'|'wrong'>('idle')
  const [inputValue, setInputValue] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Pick up to 5 random wrong words and build a quiz.
    const shuffled = [...wrongWords].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 5)
    const db = WordDatabase.getInstance()
    const qs = db.makeQuizQuestions(picked.map(w => ({ word: w.word, level: 'n3' as const })))
    setQuestions(qs.slice(0, 5))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const question = questions[currentIdx]

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ja-JP'
    utter.rate = 0.8
    speechSynthesis.speak(utter)
  }

  async function submitAnswer(answer: string) {
    if (answerState !== 'idle' || !question || !progress) return
    const correct = answer.trim() === question.correctAnswer.trim()
    const newScore = correct ? score + 1 : score
    setAnswerState(correct ? 'correct' : 'wrong')

    // Update wrong-word consecutive count
    const wrongWords = [...(progress.wrongWords ?? [])]
    const idx = wrongWords.findIndex(w => w.wordId === question.word.id)
    if (idx >= 0) {
      if (correct) {
        const newConsecutive = wrongWords[idx].consecutiveCorrect + 1
        if (newConsecutive >= 2) {
          wrongWords.splice(idx, 1)
        } else {
          wrongWords[idx] = { ...wrongWords[idx], consecutiveCorrect: newConsecutive }
        }
      } else {
        wrongWords[idx] = {
          ...wrongWords[idx],
          wrongCount: wrongWords[idx].wrongCount + 1,
          consecutiveCorrect: 0,
          lastWrongDate: new Date().toISOString(),
        }
      }
      await saveProgress({ ...progress, wrongWords })
    }

    setTimeout(() => {
      setAnswerState('idle')
      setInputValue('')
      setScore(newScore)
      if (currentIdx + 1 >= questions.length) {
        setDone(true)
      } else {
        setCurrentIdx(i => i + 1)
      }
    }, 1500)
  }

  if (questions.length === 0) return null

  if (done) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 24, padding: 32, zIndex: 200,
      }}>
        <div style={{ fontSize: 48 }}>{score >= 4 ? '✓' : '△'}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
          {score} / {questions.length}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          복습 완료!
        </div>
        <button className="btn-primary" style={{ maxWidth: 280 }}
          onClick={() => onComplete(score)}>
          확인
        </button>
      </div>
    )
  }

  if (!question) return null
  const displayText = question.word.kanji ?? question.word.reading

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '0 16px', zIndex: 200,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '16px 0' }}>
        <button onClick={onClose} style={{ background: 'none',
          border: 'none', color: 'var(--text-secondary)',
          fontSize: 20, cursor: 'pointer' }}>✕</button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          복습 {currentIdx + 1} / {questions.length}
        </span>
        <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>
          {score}점
        </span>
      </div>

      <ProgressBar value={currentIdx + 1} total={questions.length}
        color="var(--accent)" height={4} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 20 }}>

        {/* Question */}
        <div className="card" style={{ textAlign: 'center' }}>
          {question.type === 'meaningChoice' && (
            <>
              <div style={{ fontSize: 44, fontWeight: 700,
                color: 'var(--text-primary)' }}>{displayText}</div>
              <div style={{ fontSize: 16, color: 'var(--text-secondary)',
                marginTop: 8 }}>{question.word.reading}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 12 }}>뜻을 고르세요</div>
            </>
          )}
          {question.type === 'readingChoice' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 700,
                color: 'var(--text-primary)' }}>{question.word.meaning}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 12 }}>읽는 법을 고르세요</div>
            </>
          )}
          {question.type === 'readingInput' && (
            <>
              <div style={{ fontSize: 44, fontWeight: 700,
                color: 'var(--text-primary)' }}>{displayText}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 12 }}>히라가나로 입력하세요</div>
            </>
          )}
          {question.type === 'meaningInput' && (
            <>
              <div style={{ fontSize: 24, fontWeight: 700,
                color: 'var(--text-primary)' }}>{question.word.meaning}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 12 }}>일본어로 입력하세요</div>
            </>
          )}
          {question.type === 'audioChoice' && (
            <>
              <button onClick={() => speak(question.word.reading)}
                style={{ background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8, margin: '0 auto' }}>
                <span style={{ fontSize: 48, color: 'var(--accent)' }}>
                  ▶
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  탭하여 듣기
                </span>
              </button>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                marginTop: 12 }}>들은 단어를 고르세요</div>
            </>
          )}
        </div>

        {/* Feedback */}
        {answerState !== 'idle' && (
          <div style={{ padding: '12px 16px', borderRadius: 12,
            textAlign: 'center',
            background: answerState === 'correct'
              ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
            color: answerState === 'correct' ? 'var(--success)' : 'var(--fail)',
            fontSize: 14, fontWeight: 600 }}>
            {answerState === 'correct'
              ? '정답!'
              : `정답: ${question.correctAnswer}`}
          </div>
        )}

        {/* Choices or Input */}
        {question.choices.length > 0 ? (
          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {question.choices.map(choice => (
              <button key={choice}
                onClick={() => submitAnswer(choice)}
                disabled={answerState !== 'idle'}
                style={{
                  background: answerState !== 'idle' && choice === question.correctAnswer
                    ? 'rgba(76,175,80,0.25)' : 'var(--card-bg)',
                  border: `1px solid ${answerState !== 'idle' && choice === question.correctAnswer
                    ? 'var(--success)' : 'transparent'}`,
                  borderRadius: 12, padding: '16px 12px',
                  color: 'var(--text-primary)', fontSize: 14,
                  cursor: answerState === 'idle' ? 'pointer' : 'default',
                  fontWeight: 500, textAlign: 'center',
                }}>
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer(inputValue)}
              disabled={answerState !== 'idle'}
              placeholder="여기에 입력하세요"
              style={{ background: 'var(--card-bg)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '16px',
                fontSize: 18, color: 'var(--text-primary)',
                textAlign: 'center', outline: 'none',
                fontFamily: 'Paperlogy, sans-serif' }}
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
