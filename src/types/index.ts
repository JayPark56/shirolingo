export type JLPTLevel = 'n1' | 'n2' | 'n3' | 'n4' | 'n5'

export interface Word {
  id: string
  kanji: string | null
  reading: string
  meaning: string
  partOfSpeech: string
  exampleSentence: string | null
  exampleMeaning: string | null
}

export interface WordFile {
  level: string
  words: Word[]
}

export interface CharacterLine {
  id: string
  seriesName: string
  characterName: string
  evolutionLabels: string[]
  isRare: boolean
}

export interface GachaResult {
  characterId: string
  seriesName: string
  characterName: string
  isRare: boolean
}

export interface WrongWord {
  wordId: string
  word: Word
  wrongCount: number
  consecutiveCorrect: number  // resets to 0 on wrong, increments on correct
  lastWrongDate: string
  addedDate: string
}

export interface UserProgress {
  userId: string
  totalDaysCompleted: number
  currentStreak: number
  longestStreak: number
  activeCharacterId: string
  ownedCharacterIds: string[]
  completedCharacterIds: string[]
  lastStudyDate: string | null
  studiedWordIds: string[]
  characterDaysMap: Record<string, number>
  gachaRerollsAvailable: number
  wrongWords: WrongWord[]
}

export interface DailySession {
  date: string
  wordIds: string[]
  score: number
  passed: boolean
}

export type QuizType =
  | 'meaningChoice'
  | 'readingChoice'
  | 'readingInput'
  | 'meaningInput'
  | 'audioChoice'

export interface QuizQuestion {
  id: string
  word: Word
  type: QuizType
  choices: string[]
  correctAnswer: string
  userAnswer?: string
  isCorrect?: boolean
}
