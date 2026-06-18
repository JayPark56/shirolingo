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

  selectDailyWords(
    studiedIds: Set<string>,
    wrongWords: WrongWord[] = []
  ): { word: Word; level: JLPTLevel; isWrongWord?: boolean }[] {
    // Step 1: always select 10 NEW words (2 per level), preferring unstudied.
    const newWords: { word: Word; level: JLPTLevel }[] = []
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
        const idx = (dayOfYear * (selected.length + 1) *
          (LEVELS.indexOf(level) + 1) + attempts) % pool.length
        if (!selected.find(w => w.id === pool[idx].id)) {
          selected.push(pool[idx])
        }
        attempts++
      }
      selected.forEach(w => newWords.push({ word: w, level }))
    }

    // Step 2: add up to 2 wrong words ON TOP (most-wrong first, no dupes of new).
    const newWordIds = new Set(newWords.map(w => w.word.id))
    const sortedWrong = [...wrongWords]
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .filter(ww => !newWordIds.has(ww.wordId))
      .slice(0, 2)

    const wrongEntries: { word: Word; level: JLPTLevel; isWrongWord: boolean }[] = []
    for (const ww of sortedWrong) {
      for (const [level, words] of this.wordsByLevel.entries()) {
        const found = words.find(w => w.id === ww.wordId)
        if (found) {
          wrongEntries.push({ word: found, level, isWrongWord: true })
          break
        }
      }
    }

    // Step 3: combine — wrong words first, then the 10 new words.
    return [
      ...wrongEntries,
      ...newWords.map(w => ({ ...w, isWrongWord: false })),
    ]
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

  // Build 4 choices whose DISPLAYED TEXT is unique. The dataset has many words
  // sharing a meaning/reading, so a distractor's text can equal the correct
  // answer's; without this the duplicate would collide on React keys and be
  // painted as "correct" (and a wrong pick of it would score as correct).
  private uniqueChoices(correct: string, distractorTexts: string[]): string[] {
    const seen = new Set<string>([correct])
    const choices = [correct]
    for (const t of distractorTexts) {
      if (choices.length >= 4) break
      if (!seen.has(t)) { seen.add(t); choices.push(t) }
    }
    return choices.sort(() => Math.random() - 0.5)
  }

  private makeQuestion(word: Word, type: QuizType, allWords: Word[]): QuizQuestion {
    const displayText = word.kanji ?? word.reading
    const distractors = allWords.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5)

    switch (type) {
      case 'meaningChoice':
        return {
          id: `${word.id}-mc`,
          word, type,
          choices: this.uniqueChoices(word.meaning, distractors.map(w => w.meaning)),
          correctAnswer: word.meaning,
        }
      case 'readingChoice':
        return {
          id: `${word.id}-rc`,
          word, type,
          choices: this.uniqueChoices(word.reading, distractors.map(w => w.reading)),
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
          choices: this.uniqueChoices(displayText, distractors.map(w => w.kanji ?? w.reading)),
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
