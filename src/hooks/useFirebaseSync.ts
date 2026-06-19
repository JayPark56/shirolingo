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
        const data = snap.data() as UserProgress
        // Migrate old single-character data to the multi-character model.
        if (!Array.isArray(data.activeCharacterIds)) {
          data.activeCharacterIds = data.activeCharacterId ? [data.activeCharacterId] : []
        }
        setProgress(data)
      } else {
        const fresh = defaultProgress(userId)
        setDoc(ref, fresh)
        setProgress(fresh)
      }
    })
    return unsub
  }, [userId])

  // Save progress to Firestore. Update the local store FIRST (optimistic) so any
  // chained reads (next quiz answer, ResultPage) see the latest immediately and
  // can't clobber it with a stale copy; the network write follows.
  const saveProgress = useCallback(async (updated: UserProgress) => {
    if (!userId) return
    setProgress(updated)
    const ref = doc(db, 'users', userId)
    await setDoc(ref, updated)
  }, [userId])

  return { saveProgress }
}
