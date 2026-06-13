import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useWordDatabase, getLevelColor } from '../hooks/useWordDatabase'
import { ProgressBar } from '../components/ProgressBar'
import type { AppPage } from '../App'
import type { Word, JLPTLevel } from '../types'

interface Props { onNavigate: (p: AppPage) => void }

export function StudyPage({ onNavigate }: Props) {
  const { progress, setSession } = useStore()
  const { db, ready } = useWordDatabase()
  const [words, setWords] = useState<{ word: Word; level: JLPTLevel }[]>([])
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!ready || !progress) return
    const studiedIds = new Set(progress.studiedWordIds)
    const selected = db.selectDailyWords(studiedIds)
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
    setIsFlipped(false)
    if (index < words.length - 1) {
      setTimeout(() => setIndex(i => i + 1), 150)
    } else {
      // All studied — go to quiz
      const questions = db.makeQuizQuestions(words)
      setSession({ words, questions, currentWordIndex:0,
        currentQuestionIndex:0, score:0, phase:'quiz' })
      onNavigate('quiz')
    }
  }

  function goPrev() {
    if (index === 0) return
    setIsFlipped(false)
    setTimeout(() => setIndex(i => i - 1), 150)
  }

  function speak() {
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
      <div style={{ flex:1, display:'flex', alignItems:'center',
        justifyContent:'center', perspective:1000 }}
        onClick={() => setIsFlipped(f => !f)}>

        <div style={{
          width:'100%', height:300,
          position:'relative', transformStyle:'preserve-3d',
          transition:'transform 0.4s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor:'pointer',
        }}>
          {/* Front */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden',
            WebkitBackfaceVisibility:'hidden',
            background:'var(--card-bg)', borderRadius:20,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>

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

            <div style={{ fontSize:12, color:'var(--text-secondary)',
              opacity:0.5, marginTop:8 }}>탭하여 뜻 보기</div>
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
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', padding:'0 0 40px' }}>
        <button onClick={goPrev} disabled={index === 0}
          style={{ background:'none', border:'none', fontSize:28,
            color: index === 0 ? 'rgba(255,255,255,0.15)' : 'var(--text-primary)',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            padding:'8px 16px' }}>
          ‹
        </button>

        {index === words.length - 1 ? (
          <button className="btn-primary" onClick={goNext}
            style={{ maxWidth:200, fontSize:15 }}>
            테스트 시작
          </button>
        ) : (
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
            탭하여 뒤집기
          </div>
        )}

        <button onClick={goNext} disabled={index === words.length - 1 && isFlipped}
          style={{ background:'none', border:'none', fontSize:28,
            color:'var(--text-primary)', cursor:'pointer', padding:'8px 16px' }}>
          ›
        </button>
      </div>
    </div>
  )
}
