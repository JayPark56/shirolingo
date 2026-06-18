import { useState, useEffect, type CSSProperties } from 'react'
import { useStore } from '../store/useStore'
import { useWordDatabase } from '../hooks/useWordDatabase'
import { GachaPage } from './GachaPage'
import { ProgressBar } from '../components/ProgressBar'
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../utils/haptics'
import type { AppPage } from '../App'
import type { Word, JLPTLevel, QuizQuestion } from '../types'

interface Props { onNavigate: (p: AppPage) => void }

type ReviewPhase = 'intro' | 'study' | 'quizPrompt' | 'quiz' | 'result' | 'gacha'

export function ReviewPage({ onNavigate }: Props) {
  const { progress } = useStore()
  const { db, ready } = useWordDatabase()
  const [phase, setPhase] = useState<ReviewPhase>('intro')
  const [words, setWords] = useState<{ word: Word; level: JLPTLevel }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answerState, setAnswerState] = useState<'idle'|'correct'|'wrong'>('idle')
  const [inputValue, setInputValue] = useState('')
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !progress) return
    const studiedIds = progress.studiedWordIds ?? []
    if (studiedIds.length === 0) return

    // 10 random words from the ones already studied. (level is unused in review,
    // so it's left as a nominal 'n3' rather than reaching into the db internals.)
    const allWords = db.getAllWords()
    const studiedWords = allWords.filter(w => studiedIds.includes(w.id))
    const shuffled = [...studiedWords].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 10)
    setWords(picked.map(w => ({ word: w, level: 'n3' as JLPTLevel })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, progress])

  function speak(text: string, haptic = true) {
    if (haptic) hapticLight()
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ja-JP'
    utter.rate = 0.8
    speechSynthesis.speak(utter)
  }

  // Auto-play the audio when an audioChoice question appears (mirrors QuizPage),
  // without a haptic since the user didn't tap.
  useEffect(() => {
    if (phase !== 'quiz') return
    const q = questions[quizIndex]
    if (q?.type === 'audioChoice') speak(q.word.reading, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quizIndex])

  function startQuiz() {
    const qs = db.makeQuizQuestions(words)
    setQuestions(qs)
    setQuizIndex(0)
    setScore(0)
    setAnswerState('idle')
    setPhase('quiz')
  }

  function submitAnswer(answer: string) {
    if (answerState !== 'idle') return
    const question = questions[quizIndex]
    if (!question) return
    const correct = answer.trim() === question.correctAnswer.trim()
    setAnswerState(correct ? 'correct' : 'wrong')
    if (correct) hapticSuccess()
    else hapticError()

    setTimeout(() => {
      setAnswerState('idle')
      setInputValue('')
      setPendingAnswer(null)
      // Bump the score exactly as the next question appears.
      const newScore = correct ? score + 1 : score
      setScore(newScore)
      if (quizIndex + 1 >= questions.length) {
        // 1% surprise gacha (only if a draw is possible)
        if (Math.random() < 0.01 &&
          progress &&
          (progress.ownedCharacterIds?.length ?? 0) < 35
        ) {
          setPhase('gacha')
        } else {
          setPhase('result')
        }
      } else {
        setQuizIndex(i => i + 1)
      }
    }, 1500)
  }

  // Choice button styling across the four interaction states.
  function choiceStyle(choice: string): CSSProperties {
    const question = questions[quizIndex]
    let background = 'var(--card-bg)'
    let border = '1px solid transparent'
    if (answerState === 'idle') {
      if (pendingAnswer === choice) {
        background = 'rgba(155,111,219,0.18)'
        border = '1px solid #9B6FDB'
      }
    } else if (question && choice === question.correctAnswer) {
      background = 'rgba(76,175,80,0.25)'
      border = '1px solid var(--success)'
    } else if (choice === pendingAnswer) {
      background = 'rgba(244,67,54,0.2)'
      border = '1px solid var(--fail)'
    }
    return {
      background, border, borderRadius: 12, padding: '16px 12px',
      color: 'var(--text-primary)', fontSize: 14,
      cursor: answerState === 'idle' ? 'pointer' : 'default',
      fontWeight: 500, textAlign: 'center', transition: 'all 0.2s',
    }
  }

  // INTRO phase
  if (phase === 'intro') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '32px 24px',
        background: 'var(--bg)', gap: 32, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(107,79,187,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#9B6FDB" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            <line x1="9" y1="7" x2="15" y2="7"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 16,
            fontFamily: 'Paperlogy, sans-serif' }}>
            하루에 너무 많이 할 필요 없어요
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)',
            lineHeight: 1.8, whiteSpace: 'pre-line', fontFamily: 'Paperlogy, sans-serif' }}>
            대신 복습을 합시다!{'\n\n'}
            지금까지 배운 단어 중 랜덤으로{'\n'}
            10개를 공부하고{'\n'}
            원하면 시험도 볼 수 있습니다
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 320,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-primary"
            onClick={() => setPhase('study')}
            style={{ background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)' }}
            disabled={words.length === 0}>
            {words.length === 0 ? '단어 불러오는 중...' : '복습 시작'}
          </button>
          <button className="btn-secondary"
            onClick={() => onNavigate('home')}>
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // STUDY phase
  if (phase === 'study') {
    const current = words[currentIndex]
    if (!current) return null
    const displayText = current.word.kanji ?? current.word.reading

    return (
      <div style={{ display: 'flex', flexDirection: 'column',
        height: '100vh', padding: '0 16px', background: 'var(--bg)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 0' }}>
          <button onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            복습 {currentIndex + 1} / {words.length}
          </span>
          <div style={{ width: 32 }} />
        </div>

        <ProgressBar value={currentIndex + 1} total={words.length}
          color="#9B6FDB" height={4} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16 }}>

          <div style={{ position: 'relative', width: '100%', height: 300, perspective: 1000 }}>

            <div style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.4s ease',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            {/* Front */}
            <div style={{ position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              background: 'var(--card-bg)', borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, padding: 32 }}>
              <div style={{ fontSize: 52, fontWeight: 700,
                color: 'var(--text-primary)', textAlign: 'center' }}>
                {displayText}
              </div>
              <div style={{ fontSize: 22, color: 'var(--text-secondary)' }}>
                {current.word.reading}
              </div>
              <button onClick={e => { e.stopPropagation(); speak(current.word.reading) }}
                style={{ background: 'rgba(233,69,96,0.15)', border: 'none',
                  color: 'var(--accent)', borderRadius: 20,
                  padding: '8px 20px', fontSize: 14, cursor: 'pointer' }}>
                발음 듣기
              </button>
            </div>

            {/* Back */}
            <div style={{ position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'var(--card-bg)', borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: 32 }}>
              <div style={{ fontSize: 28, fontWeight: 700,
                color: 'var(--text-primary)', textAlign: 'center' }}>
                {current.word.meaning}
              </div>
              <div style={{ background: 'rgba(245,166,35,0.15)',
                color: 'var(--accent-secondary)', padding: '4px 12px',
                borderRadius: 8, fontSize: 13 }}>
                {current.word.partOfSpeech}
              </div>
              {current.word.exampleSentence && (
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                    lineHeight: 1.6 }}>{current.word.exampleSentence}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)',
                    opacity: 0.7, marginTop: 4 }}>{current.word.exampleMeaning}</div>
                </div>
              )}
            </div>
          </div>

          {/* Prev — inside the card, bottom-left */}
          <button onClick={() => { hapticLight(); setIsFlipped(false); setCurrentIndex(i => Math.max(0, i - 1)) }}
            disabled={currentIndex === 0}
            style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 5,
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: currentIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'Paperlogy, sans-serif' }}>
            ‹ 이전
          </button>

          {/* Next / 다음 — inside the card, bottom-right */}
          {currentIndex === words.length - 1 ? (
            <button onClick={() => { hapticLight(); setPhase('quizPrompt') }}
              style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 5,
                background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)',
                border: 'none', borderRadius: 10, padding: '8px 16px',
                fontSize: 13, fontWeight: 700, color: 'white',
                cursor: 'pointer', fontFamily: 'Paperlogy, sans-serif' }}>
              다음
            </button>
          ) : (
            <button onClick={() => { hapticLight(); setIsFlipped(false); setCurrentIndex(i => Math.min(words.length - 1, i + 1)) }}
              style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 5,
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                padding: '8px 14px', fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'Paperlogy, sans-serif' }}>
              다음 ›
            </button>
          )}
        </div>

        {/* Flip button below the card */}
        <button onClick={() => { hapticLight(); setIsFlipped(f => !f) }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 12, padding: 14,
            color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
            fontFamily: 'Paperlogy, sans-serif' }}>
          여기 눌러서 뜻 보기
        </button>
      </div>
      </div>
    )
  }

  // QUIZ PROMPT phase
  if (phase === 'quizPrompt') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '32px 24px',
        background: 'var(--bg)', gap: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700,
          color: 'var(--text-primary)', fontFamily: 'Paperlogy, sans-serif' }}>
          복습 완료!
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)',
          lineHeight: 1.8 }}>
          시험도 볼까요?
        </div>
        <div style={{ width: '100%', maxWidth: 320,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-primary" onClick={startQuiz}
            style={{ background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)' }}>
            시험 볼게요
          </button>
          <button className="btn-secondary"
            onClick={() => onNavigate('home')}>
            그냥 끝낼게요
          </button>
        </div>
      </div>
    )
  }

  // QUIZ phase
  if (phase === 'quiz') {
    const question = questions[quizIndex]
    if (!question) return null
    const displayText = question.word.kanji ?? question.word.reading

    return (
      <div style={{ display: 'flex', flexDirection: 'column',
        height: '100vh', padding: '0 16px', background: 'var(--bg)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 0' }}>
          <button onClick={() => onNavigate('home')}
            style={{ background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
          <span style={{ color: '#9B6FDB', fontWeight: 700 }}>
            복습 점수: {score}
          </span>
        </div>

        <ProgressBar value={quizIndex + 1} total={questions.length}
          color="#9B6FDB" height={4} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: 20 }}>

          <div className="card" style={{ textAlign: 'center' }}>
            {question.type === 'audioChoice' ? (
              <>
                <button onClick={() => speak(question.word.reading)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8, margin: '0 auto' }}>
                  <span style={{ fontSize: 48, color: 'var(--accent)' }}>🔊</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    탭하여 다시 듣기
                  </span>
                </button>
                <div style={{ marginTop: 12, fontSize: 13,
                  color: 'var(--text-secondary)' }}>들은 단어를 고르세요</div>
              </>
            ) : question.type === 'meaningChoice' ? (
              <>
                <div style={{ fontSize: 44, fontWeight: 700,
                  color: 'var(--text-primary)' }}>{displayText}</div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)',
                  marginTop: 8 }}>{question.word.reading}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                  marginTop: 12 }}>뜻을 고르세요</div>
              </>
            ) : question.type === 'readingChoice' ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 700,
                  color: 'var(--text-primary)' }}>{question.word.meaning}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                  marginTop: 12 }}>읽는 법을 고르세요</div>
              </>
            ) : question.type === 'readingInput' ? (
              <>
                <div style={{ fontSize: 44, fontWeight: 700,
                  color: 'var(--text-primary)' }}>{displayText}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                  marginTop: 12 }}>히라가나로 입력하세요</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 24, fontWeight: 700,
                  color: 'var(--text-primary)' }}>{question.word.meaning}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                  marginTop: 12 }}>일본어로 입력하세요</div>
              </>
            )}
          </div>

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

          {question.choices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {question.choices.map(choice => (
                  <button key={choice}
                    onClick={() => {
                      if (answerState !== 'idle') return
                      hapticLight()
                      setPendingAnswer(choice)
                    }}
                    disabled={answerState !== 'idle'}
                    style={choiceStyle(choice)}>
                    {choice}
                  </button>
                ))}
              </div>
              {pendingAnswer && answerState === 'idle' && (
                <button className="btn-primary"
                  onClick={() => { hapticMedium(); submitAnswer(pendingAnswer) }}
                  style={{ background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)' }}>
                  확인
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { hapticMedium(); submitAnswer(inputValue) } }}
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
                onClick={() => { hapticMedium(); submitAnswer(inputValue) }}
                disabled={!inputValue || answerState !== 'idle'}
                style={{ background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)' }}>
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // RESULT phase
  if (phase === 'result') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '32px 24px',
        background: 'var(--bg)', gap: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>{score >= 8 ? '✓' : '△'}</div>
        <div style={{ fontSize: 28, fontWeight: 700,
          color: 'var(--text-primary)' }}>
          {score} / {questions.length}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          복습 결과 (스트릭에 영향 없음)
        </div>
        <button className="btn-primary"
          style={{ maxWidth: 280,
            background: 'linear-gradient(135deg, #6B4FBB, #9B6FDB)' }}
          onClick={() => onNavigate('home')}>
          홈으로
        </button>
      </div>
    )
  }

  // GACHA phase (1% surprise)
  if (phase === 'gacha') {
    return (
      <div>
        <div style={{
          position: 'fixed', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          background: 'linear-gradient(135deg, #6B4FBB, var(--accent))',
          padding: '12px 16px', textAlign: 'center', zIndex: 300,
          fontSize: 14, fontWeight: 700, color: 'white',
          fontFamily: 'Paperlogy, sans-serif',
        }}>
          깜짝 가챠!
        </div>
        <GachaPage
          isFirstLaunch={false}
          isSurprise={true}
          onComplete={() => onNavigate('home')}
        />
      </div>
    )
  }

  return null
}
