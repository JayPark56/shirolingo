import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProgress, QuizQuestion, Word } from '../types'

interface AppState {
  // Auth
  userId: string | null
  setUserId: (id: string | null) => void

  // Progress
  progress: UserProgress | null
  setProgress: (p: UserProgress) => void
  updateProgress: (partial: Partial<UserProgress>) => void

  // Current session
  currentSession: {
    words: { word: Word; level: string }[]
    questions: QuizQuestion[]
    currentWordIndex: number
    currentQuestionIndex: number
    score: number
    phase: 'study' | 'quiz' | 'result'
  } | null
  setSession: (session: AppState['currentSession']) => void
  clearSession: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),

      progress: null,
      setProgress: (p) => set({ progress: p }),
      updateProgress: (partial) => {
        const current = get().progress
        if (current) set({ progress: { ...current, ...partial } })
      },

      currentSession: null,
      setSession: (session) => set({ currentSession: session }),
      clearSession: () => set({ currentSession: null }),
    }),
    {
      name: 'shirolingo-store',
      partialize: (state) => ({
        userId: state.userId,
        progress: state.progress,
      }),
    }
  )
)

export function defaultProgress(userId: string): UserProgress {
  return {
    userId,
    totalDaysCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    activeCharacterId: '',
    ownedCharacterIds: [],
    completedCharacterIds: [],
    lastStudyDate: null,
    studiedWordIds: [],
    characterDaysMap: {},
    gachaRerollsAvailable: 0,
    wrongWords: [],
  }
}
