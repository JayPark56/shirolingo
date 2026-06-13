import { useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useStore, defaultProgress } from '../store/useStore'
import type { UserProgress } from '../types'

export function useFirebaseSync() {
  const { userId, setProgress } = useStore()

  // Load progress from Firestore on login (and keep it in sync live).
  useEffect(() => {
    if (!userId) return
    const ref = doc(db, 'users', userId)

    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setProgress(snap.data() as UserProgress)
      } else {
        const fresh = defaultProgress(userId)
        setDoc(ref, fresh)
        setProgress(fresh)
      }
    })
    return unsub
  }, [userId])

  // Save progress to Firestore.
  const saveProgress = useCallback(async (updated: UserProgress) => {
    if (!userId) return
    const ref = doc(db, 'users', userId)
    await setDoc(ref, updated)
    setProgress(updated)
  }, [userId])

  return { saveProgress }
}
