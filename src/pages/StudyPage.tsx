import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { useWordDatabase, getLevelColor } from '../hooks/useWordDatabase'
import { ProgressBar } from '../components/ProgressBar'
import { hapticLight } from '../utils/haptics'
import type { AppPage } from '../App'
import type { Word, JLPTLevel } from '../types'

interface Props { onNavigate: (p: AppPage) => void }

export function StudyPage({ onNavigate }: Props) {
  const { progress, setSession } = useStore()
  const { db, ready } = useWordDatabase()
  const [words, setWords] = useState<{ word: Word; level: JLPTLevel; isWrongWord?: boolean }[]>([])
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  // Guards the 150ms card-swap transition so a fast double-tap on the nav arrows
  // can't fire two index updates (which could skip a card or run past the end).
  const transitioning = useRef(false)

  useEffect(() => {
    if (!ready || !progress) return
    const studiedIds = new Set(progress.studiedWordIds)
    const selected = db.selectDailyWords(studiedIds, progress.wrongWords ?? [])
    setWords(selected)
  }, [ready, progress])

  if (!ready || words.length === 0) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', color:'var(--text-secondary)' }}>
        단어 불러오는 중...
      </div>
    )
  }

  const current = words[index]
  const levelColor = getLevelColor(current.level)
  const displayText = current.word.kanji ?? current.word.reading

  function goNext() {
    if (transitioning.current) return
    hapticLight()
    setIsFlipped(false)
    if (index < words.length - 1) {
      transitioning.current = true
      setTimeout(() => { setIndex(i => i + 1); transitioning.current = false }, 150)
    } else {
      // Study shows ALL words (10 new + up to 2 wrong); the quiz uses a random 10
      // drawn from that full set.
      const quizWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10)
      const questions = db.makeQuizQuestions(quizWords)
      setSession({ words, questions, currentWordIndex:0,
        currentQuestionIndex:0, score:0, phase:'quiz' })
      onNavigate('quiz')
    }
  }

  function goPrev() {
    if (index === 0 || transitioning.current) return
    hapticLight()
    setIsFlipped(false)
    transitioning.current = true
    setTimeout(() => { setIndex(i => i - 1); transitioning.current = false }, 150)
  }

  function speak() {
    hapticLight()
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(current.word.reading)
    utter.lang = 'ja-JP'
    utter.rate = 0.8
    speechSynthesis.speak(utter)
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
        <span style={{ color:'var(--text-secondary)', fontSize:14 }}>
          {index + 1} / {words.length}
        </span>
        <div style={{ width:32 }} />
      </div>

      <ProgressBar value={index + 1} total={words.length} color="var(--accent)" height={4} />

      {/* Card */}
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:16 }}>

        <div style={{ position:'relative', width:'100%', height:300, perspective:1000 }}>

          <div style={{
            width:'100%', height:'100%',
            position:'relative', transformStyle:'preserve-3d',
            transition:'transform 0.4s ease',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
          {/* Front */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden',
            WebkitBackfaceVisibility:'hidden',
            background:'var(--card-bg)', borderRadius:20,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>

            {current.isWrongWord && (
              <div style={{
                position:'absolute', top:16, right:16,
                background:'rgba(244,67,54,0.15)',
                border:'1px solid rgba(244,67,54,0.3)',
                color:'var(--fail)', fontSize:11, fontWeight:700,
                padding:'3px 8px', borderRadius:6,
              }}>
                틀렸던 단어
              </div>
            )}

            <div className="level-badge" style={{ background:`${levelColor}20`,
              color:levelColor }}>{current.level.toUpperCase()}</div>

            <div style={{ fontSize:52, fontWeight:700,
              color:'var(--text-primary)', textAlign:'center' }}>
              {displayText}
            </div>
            <div style={{ fontSize:22, color:'var(--text-secondary)' }}>
              {current.word.reading}
            </div>

            <button onClick={e => { e.stopPropagation(); speak() }}
              style={{ background:'rgba(233,69,96,0.15)', border:'none',
                color:'var(--accent)', borderRadius:20, padding:'8px 20px',
                fontSize:14, cursor:'pointer', display:'flex',
                alignItems:'center', gap:6 }}>
              🔊 발음 듣기
            </button>
          </div>

          {/* Back */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden',
            WebkitBackfaceVisibility:'hidden', transform:'rotateY(180deg)',
            background:'var(--card-bg)', borderRadius:20,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:12, padding:32 }}>

            <div className="level-badge" style={{ background:`${levelColor}20`,
              color:levelColor }}>{current.level.toUpperCase()}</div>

            <div style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)',
              textAlign:'center' }}>{current.word.meaning}</div>

            <div style={{ background:'rgba(245,166,35,0.15)', color:'var(--accent-secondary)',
              padding:'4px 12px', borderRadius:8, fontSize:13 }}>
              {current.word.partOfSpeech}
            </div>

            {current.word.exampleSentence && (
              <div style={{ textAlign:'center', padding:'0 8px' }}>
                <div style={{ fontSize:13, color:'var(--text-secondary)',
                  lineHeight:1.6 }}>{current.word.exampleSentence}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)',
                  opacity:0.7, marginTop:4 }}>{current.word.exampleMeaning}</div>
              </div>
            )}
          </div>
          </div>

          {/* Prev — inside the card, bottom-left */}
          <button onClick={goPrev} disabled={index === 0}
            style={{ position:'absolute', bottom:14, left:14, zIndex:5,
              background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10,
              padding:'8px 14px', fontSize:13, fontWeight:600,
              color: index === 0 ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:4,
              fontFamily:'Paperlogy, sans-serif' }}>
            ‹ 이전
          </button>

          {/* Next / 테스트 시작 — inside the card, bottom-right */}
          {index === words.length - 1 ? (
            <button onClick={goNext}
              style={{ position:'absolute', bottom:14, right:14, zIndex:5,
                background:'var(--accent)', border:'none', borderRadius:10,
                padding:'8px 16px', fontSize:13, fontWeight:700, color:'white',
                cursor:'pointer', fontFamily:'Paperlogy, sans-serif' }}>
              테스트 시작
            </button>
          ) : (
            <button onClick={goNext}
              style={{ position:'absolute', bottom:14, right:14, zIndex:5,
                background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10,
                padding:'8px 14px', fontSize:13, fontWeight:600,
                color:'var(--text-primary)', cursor:'pointer',
                display:'flex', alignItems:'center', gap:4,
                fontFamily:'Paperlogy, sans-serif' }}>
              다음 ›
            </button>
          )}
        </div>

        {/* Flip button below the card */}
        <button onClick={() => { hapticLight(); setIsFlipped(f => !f) }}
          style={{ width:'100%', background:'rgba(255,255,255,0.06)',
            border:'none', borderRadius:12, padding:14,
            color:'var(--text-secondary)', fontSize:14, cursor:'pointer',
            fontFamily:'Paperlogy, sans-serif' }}>
          여기 눌러서 뜻 보기
        </button>
      </div>
    </div>
  )
}
