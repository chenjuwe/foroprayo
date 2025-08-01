// 統一導出所有類型定義
export * from './common'
export * from './prayer'

// 重新導出常用的類型別名
export type User = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  createdAt: string
  updatedAt: string
  isGuest: boolean
}

// 簡化的禱告類型（用於測試）
export type Prayer = {
  id: string
  userId: string
  content: string
  title?: string
  isAnonymous: boolean
  isAnswered: boolean
  answeredAt?: string | null
  createdAt: string
  updatedAt: string
  likes: number
  responses: number
  tags?: string[]
}

// 簡化的禱告回應類型（用於測試）
export type PrayerResponse = {
  id: string
  prayerId: string
  userId: string
  content: string
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
  likes: number
}

// 從 prayer.ts 重新導出
export type { BaptismPost, JourneyPost, MiraclePost } from './prayer' 