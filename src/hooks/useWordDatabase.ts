import { useState, useEffect } from 'react'
import type { Word, JLPTLevel, QuizQuestion, QuizType } from '../types'

const LEVELS: JLPTLevel[] = ['n5', 'n4', 'n3', 'n2', 'n1']

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  n5: '#4FC3F7',
  n4: '#81C784',
  n3: '#FFD54F',
  n2: '#FF8A65',
  n1: '#CE93D8',
}

export function getLevelColor(level: JLPTLevel): string {
  return LEVEL_COLORS[level]
}

export class WordDatabase {
  private static instance: WordDatabase
  private wordsByLevel: Map<JLPTLevel, Word[]> = new Map()
  private loaded = false

  static getInstance(): WordDatabase {
    if (!WordDatabase.instance) {
      WordDatabase.instance = new WordDatabase()
    }
    return WordDatabase.instance
  }

  // Word JSON is served from public/data/words/ (static asset, works in dev + prod).
  async load(): Promise<void> {
    if (this.loaded) return
    await Promise.all(
      LEVELS.map(async level => {
        const res = await fetch(`/data/words/${level}_words.json`)
        const data = await res.json()
        this.wordsByLevel.set(level, data.words as Word[])
      })
    )
    this.loaded = true
  }

  selectDailyWords(studiedIds: Set<string>): { word: Word; level: JLPTLevel }[] {
    const result: { word: Word; level: JLPTLevel }[] = []
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )

    for (const level of LEVELS) {
      const words = this.wordsByLevel.get(level) ?? []
      const unstudied = words.filter(w => !studiedIds.has(w.id))
      const pool = unstudied.length > 0 ? unstudied : words
      if (pool.length === 0) continue

      const selected: Word[] = []
      let attempts = 0
      while (selected.length < 2 && attempts < 200) {
        const idx = (dayOfYear * (selected.length + 1) * (LEVELS.indexOf(level) + 1) + attempts) % pool.length
        if (!selected.find(w => w.id === pool[idx].id)) {
          selected.push(pool[idx])
        }
        attempts++
      }
      selected.forEach(w => result.push({ word: w, level }))
    }
    return result
  }

  makeQuizQuestions(words: { word: Word; level: JLPTLevel }[]): QuizQuestion[] {
    const allWords = [...this.wordsByLevel.values()].flat()
    const types: QuizType[] = [
      'meaningChoice', 'readingChoice', 'readingInput',
      'meaningInput', 'audioChoice',
      'meaningChoice', 'readingChoice', 'readingInput',
      'meaningInput', 'audioChoice',
    ]

    return words.map((item, i) => {
      const type = types[i % types.length]
      return this.makeQuestion(item.word, type, allWords)
    }).sort(() => Math.random() - 0.5)
  }

  private makeQuestion(word: Word, type: QuizType, allWords: Word[]): QuizQuestion {
    const displayText = word.kanji ?? word.reading
    const distractors = allWords.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5)

    switch (type) {
      case 'meaningChoice':
        return {
          id: `${word.id}-mc`,
          word, type,
          choices: [word.meaning, ...distractors.slice(0, 3).map(w => w.meaning)].sort(() => Math.random() - 0.5),
          correctAnswer: word.meaning,
        }
      case 'readingChoice':
        return {
          id: `${word.id}-rc`,
          word, type,
          choices: [word.reading, ...distractors.slice(0, 3).map(w => w.reading)].sort(() => Math.random() - 0.5),
          correctAnswer: word.reading,
        }
      case 'readingInput':
        return { id: `${word.id}-ri`, word, type, choices: [], correctAnswer: word.reading }
      case 'meaningInput':
        return { id: `${word.id}-mi`, word, type, choices: [], correctAnswer: word.reading }
      case 'audioChoice':
        return {
          id: `${word.id}-ac`,
          word, type,
          choices: [displayText, ...distractors.slice(0, 3).map(w => w.kanji ?? w.reading)].sort(() => Math.random() - 0.5),
          correctAnswer: displayText,
        }
    }
  }

  getAllWords(): Word[] {
    return [...this.wordsByLevel.values()].flat()
  }
}

export function useWordDatabase() {
  const [db] = useState(() => WordDatabase.getInstance())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    db.load().then(() => setReady(true))
  }, [db])

  return { db, ready }
}
