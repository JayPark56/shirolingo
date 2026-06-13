import type { GachaResult } from '../types'
import { ALL_CHARACTERS } from '../data/characters'

const GACHA_POOL: {
  seriesName: string
  characters: { id: string; weight: number; isRare: boolean }[]
}[] = [
  { seriesName: '포켓몬', characters: [
    { id: 'charmander', weight: 30, isRare: false },
    { id: 'bulbasaur',  weight: 30, isRare: false },
    { id: 'squirtle',   weight: 30, isRare: false },
    { id: 'pikachu',    weight: 10, isRare: true  },
  ]},
  { seriesName: '은혼', characters: [
    { id: 'gintoki',   weight: 35, isRare: false },
    { id: 'kagura',    weight: 35, isRare: false },
    { id: 'shinpachi', weight: 20, isRare: false },
    { id: 'katsura',   weight: 10, isRare: true  },
  ]},
  { seriesName: '헌터헌터', characters: [
    { id: 'gon',      weight: 35, isRare: false },
    { id: 'killua',   weight: 35, isRare: false },
    { id: 'leorio',   weight: 20, isRare: false },
    { id: 'kurapika', weight: 10, isRare: true  },
  ]},
  { seriesName: '하이큐', characters: [
    { id: 'hinata',   weight: 30, isRare: false },
    { id: 'kageyama', weight: 30, isRare: false },
    { id: 'bokuto',   weight: 25, isRare: false },
    { id: 'ushijima', weight: 15, isRare: false },
  ]},
  { seriesName: '유유백서', characters: [
    { id: 'yusuke', weight: 25, isRare: false },
    { id: 'kurama', weight: 25, isRare: false },
    { id: 'hiei',   weight: 20, isRare: false },
    { id: 'kazuma', weight: 20, isRare: false },
    { id: 'botan',  weight: 10, isRare: true  },
  ]},
  { seriesName: '원피스', characters: [
    { id: 'luffy',  weight: 35, isRare: false },
    { id: 'zoro',   weight: 35, isRare: false },
    { id: 'sanji',  weight: 20, isRare: false },
    { id: 'shanks', weight: 10, isRare: true  },
  ]},
  { seriesName: '짱구', characters: [
    { id: 'crayon_shin',  weight: 35, isRare: false },
    { id: 'crayon_maeng', weight: 30, isRare: false },
    { id: 'crayon_white', weight: 20, isRare: false },
    { id: 'crayon_chul',  weight: 10, isRare: false },
    { id: 'crayon_yuri',  weight:  5, isRare: true  },
  ]},
  { seriesName: '주술회전', characters: [
    { id: 'jjk_itadori', weight: 30, isRare: false },
    { id: 'jjk_nanami',  weight: 30, isRare: false },
    { id: 'jjk_gojo',    weight: 20, isRare: false },
    { id: 'jjk_geto',    weight: 15, isRare: false },
    { id: 'jjk_yuta',    weight:  5, isRare: true  },
  ]},
]

export function drawGacha(ownedIds: string[]): GachaResult | null {
  const ownedSet = new Set(ownedIds)

  const availablePool = GACHA_POOL
    .map(series => ({
      ...series,
      characters: series.characters.filter(c => !ownedSet.has(c.id)),
    }))
    .filter(series => series.characters.length > 0)

  if (availablePool.length === 0) return null

  const seriesIndex = Math.floor(Math.random() * availablePool.length)
  const selectedSeries = availablePool[seriesIndex]

  const totalWeight = selectedSeries.characters.reduce((sum, c) => sum + c.weight, 0)
  let random = Math.random() * totalWeight

  for (const char of selectedSeries.characters) {
    random -= char.weight
    if (random <= 0) {
      const charLine = ALL_CHARACTERS.find(c => c.id === char.id)!
      return {
        characterId: char.id,
        seriesName: selectedSeries.seriesName,
        characterName: charLine.characterName,
        isRare: char.isRare,
      }
    }
  }

  const last = selectedSeries.characters[selectedSeries.characters.length - 1]
  const charLine = ALL_CHARACTERS.find(c => c.id === last.id)!
  return {
    characterId: last.id,
    seriesName: selectedSeries.seriesName,
    characterName: charLine.characterName,
    isRare: last.isRare,
  }
}
