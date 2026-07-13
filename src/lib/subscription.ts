// サブスクリプション状態管理（localStorage）

export type PlanType = 'free' | 'lite' | 'premium'

export interface SubscriptionState {
  plan: PlanType
  validUntil: string | null   // ISO日付文字列
  aiReadingCount: number      // 今月の使用回数
  aiReadingResetDate: string  // 月初リセット日
}

const STORAGE_KEY = 'mooncycle_subscription'

function defaultState(): SubscriptionState {
  return {
    plan: 'free',
    validUntil: null,
    aiReadingCount: 0,
    aiReadingResetDate: new Date().toISOString(),
  }
}

export function getSubscription(): SubscriptionState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()

    const state: SubscriptionState = JSON.parse(raw) as SubscriptionState

    // 有効期限チェック
    if (state.validUntil && new Date(state.validUntil) < new Date()) {
      const reset = defaultState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset))
      return reset
    }

    // 月次リセットチェック
    const resetDate = new Date(state.aiReadingResetDate)
    const now = new Date()
    if (
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()
    ) {
      state.aiReadingCount = 0
      state.aiReadingResetDate = now.toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }

    return state
  } catch {
    return defaultState()
  }
}

export function setSubscription(plan: PlanType, validUntil: Date): void {
  const current = getSubscription()
  const state: SubscriptionState = {
    ...current,
    plan,
    validUntil: validUntil.toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function incrementAiReadingCount(): void {
  const state = getSubscription()
  state.aiReadingCount++
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const AI_READING_LIMITS: Record<PlanType, number | null> = {
  free: 0,
  lite: 50,
  premium: null, // 無制限
}

export function canUseAiReading(spreadId?: string): {
  allowed: boolean
  reason?: string
  remaining?: number
} {
  // 1枚引き・3枚引きは無料ユーザーも利用可
  if (spreadId === 'daily' || spreadId === 'three') {
    return { allowed: true }
  }

  const state = getSubscription()
  if (state.plan === 'premium') return { allowed: true }
  if (state.plan === 'lite') {
    const remaining = 50 - state.aiReadingCount
    if (remaining > 0) return { allowed: true, remaining }
    return {
      allowed: false,
      reason: '今月のAIリーディング回数（50回）を使い切りました',
    }
  }
  // free プランは daily/three 以外は不可
  return {
    allowed: false,
    reason: 'このスプレッドのAIリーディングはライトプラン以上でご利用いただけます',
  }
}

export function canUsePremiumSpread(): boolean {
  const { plan } = getSubscription()
  return plan === 'lite' || plan === 'premium'
}
