import { useState, useEffect } from 'react'
import type { Word, JLPTLevel, QuizQuestion, QuizType, WrongWord } from '../types'

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

  selectDailyWords(studiedIds: Set<string>, wrongWords: WrongWord[] = []): { word: Word; level: JLPTLevel }[] {
    const result: { word: Word; level: JLPTLevel }[] = []
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )

    // First: up to 2 wrong words (most-wrong first), prioritized in today's study.
    const sortedWrong = [...wrongWords].sort((a, b) => b.wrongCount - a.wrongCount)
    const wrongToInclude = sortedWrong.slice(0, 2)
    for (const ww of wrongToInclude) {
      for (const [level, words] of this.wordsByLevel.entries()) {
        const found = words.find(w => w.id === ww.wordId)
        if (found) {
          result.push({ word: found, level })
          break
        }
      }
    }

    const wrongIds = new Set(wrongToInclude.map(w => w.wordId))
    const newWordsNeeded = 10 - result.length
    const wordsPerLevel = Math.ceil(newWordsNeeded / 5)
    let remaining = newWordsNeeded

    // Then: fill the rest with new words (skip wrong-word ids).
    for (const level of LEVELS) {
      if (remaining <= 0) break
      const words = this.wordsByLevel.get(level) ?? []
      const available = words.filter(w => !studiedIds.has(w.id) && !wrongIds.has(w.id))
      const pool = available.length > 0 ? available : words.filter(w => !wrongIds.has(w.id))
      if (pool.length === 0) continue

      const count = Math.min(wordsPerLevel, remaining)
      const selected: Word[] = []
      let attempts = 0
      while (selected.length < count && attempts < 200) {
        const idx = (dayOfYear * (selected.length + 1) * (LEVELS.indexOf(level) + 1) + attempts) % pool.length
        if (!selected.find(w => w.id === pool[idx].id)) {
          selected.push(pool[idx])
        }
        attempts++
      }
      selected.forEach(w => result.push({ word: w, level }))
      remaining -= selected.length
    }

    // Top-up: if a level's small pool left the day short of 10, pull any remaining
    // (non-duplicate, non-wrong) words so the daily set is always ~10.
    if (result.length < 10) {
      const have = new Set(result.map(r => r.word.id))
      for (const level of LEVELS) {
        if (result.length >= 10) break
        for (const w of (this.wordsByLevel.get(level) ?? [])) {
          if (result.length >= 10) break
          if (!have.has(w.id) && !wrongIds.has(w.id)) {
            result.push({ word: w, level })
            have.add(w.id)
          }
        }
      }
    }

    return result.slice(0, 10)
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
