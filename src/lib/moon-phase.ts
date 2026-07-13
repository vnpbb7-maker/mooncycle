/**
 * 月相計算ロジック
 * Flutter MoonCycle アプリ（lib/services/moon_phase_service.dart）から TypeScript へ移植
 */

// ── 型定義 ──────────────────────────────────────────────────────────────────

export type MoonPhase =
  | 'newMoon'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'fullMoon'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent'

export interface MoonPhaseData {
  phase: MoonPhase
  phaseLabel: string
  phaseEmoji: string
  /** 0.0（新月）〜 1.0（満月）の輝面比 */
  illumination: number
  moonSign: string
  theme: string
  nextNewMoon: Date
  nextFullMoon: Date
}

// ── 定数 ───────────────────────────────────────────────────────────────────

/** 2000年1月6日 18:14 UTC を新月の基準点とする */
const BASE_NEW_MOON = new Date('2000-01-06T18:14:00Z')

/** 朔望月（新月→新月）の日数 */
const SYNODIC_MONTH = 29.530589

/** 月が1日に進む黄道経度 */
const MOON_DAILY_MOTION = 13.176

/** 基準点での月の黄道経度（概算） */
const BASE_LONGITUDE = 285

const PHASE_LABELS: Record<MoonPhase, string> = {
  newMoon:        '新月',
  waxingCrescent: '三日月',
  firstQuarter:   '上弦の月',
  waxingGibbous:  '十三夜',
  fullMoon:       '満月',
  waningGibbous:  '十六夜',
  lastQuarter:    '下弦の月',
  waningCrescent: '晦月',
}

const PHASE_EMOJI: Record<MoonPhase, string> = {
  newMoon:        '🌑',
  waxingCrescent: '🌒',
  firstQuarter:   '🌓',
  waxingGibbous:  '🌔',
  fullMoon:       '🌕',
  waningGibbous:  '🌖',
  lastQuarter:    '🌗',
  waningCrescent: '🌘',
}

const PHASE_THEMES: Record<MoonPhase, string> = {
  newMoon:        '種まき・新たな始まり',
  waxingCrescent: '意図を育てる・引き寄せ',
  firstQuarter:   '行動・決断・挑戦',
  waxingGibbous:  '洗練・調整・継続',
  fullMoon:       '完成・感謝・解放',
  waningGibbous:  '分かち合い・感謝を広げる',
  lastQuarter:    '手放し・浄化・整理',
  waningCrescent: '休息・内省・次への準備',
}

const ZODIAC_SIGNS = [
  '山羊座', '水瓶座', '魚座', '牡羊座', '牡牛座', '双子座',
  '蟹座',   '獅子座', '乙女座', '天秤座', '蠍座',   '射手座',
]

// ── メイン関数 ──────────────────────────────────────────────────────────────

/**
 * 指定した日時の月相データを計算して返す。
 * @param date 計算対象日時（省略時は現在時刻）
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhaseData {
  // 基準点からの経過日数
  const diffDays =
    (date.getTime() - BASE_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)

  // 現在の月齢（0〜29.53）
  const currentAge =
    ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH

  // 月の位相角（0°〜360°）
  const angle = (currentAge / SYNODIC_MONTH) * 360

  // 輝面比（0.0=新月, 1.0=満月）
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2

  // 月相の判定
  let phase: MoonPhase
  if      (angle < 45)  phase = 'newMoon'
  else if (angle < 90)  phase = 'waxingCrescent'
  else if (angle < 135) phase = 'firstQuarter'
  else if (angle < 180) phase = 'waxingGibbous'
  else if (angle < 225) phase = 'fullMoon'
  else if (angle < 270) phase = 'waningGibbous'
  else if (angle < 315) phase = 'lastQuarter'
  else                  phase = 'waningCrescent'

  // 月星座の計算（概算）
  const moonLongitude = (BASE_LONGITUDE + diffDays * MOON_DAILY_MOTION) % 360
  const moonSign = ZODIAC_SIGNS[Math.floor(moonLongitude / 30)]

  // 次の新月・満月の日時
  const daysToNewMoon = SYNODIC_MONTH - currentAge
  const nextNewMoon = new Date(
    date.getTime() + daysToNewMoon * 24 * 60 * 60 * 1000,
  )

  const daysToFullMoon =
    currentAge < SYNODIC_MONTH / 2
      ? SYNODIC_MONTH / 2 - currentAge
      : SYNODIC_MONTH * 1.5 - currentAge
  const nextFullMoon = new Date(
    date.getTime() + daysToFullMoon * 24 * 60 * 60 * 1000,
  )

  return {
    phase,
    illumination,
    phaseLabel: PHASE_LABELS[phase],
    phaseEmoji: PHASE_EMOJI[phase],
    moonSign,
    theme: PHASE_THEMES[phase],
    nextNewMoon,
    nextFullMoon,
  }
}

// ── ユーティリティ ──────────────────────────────────────────────────────────

/**
 * 次の新月まで何日かを返す（小数点以下切り捨て）
 */
export function daysUntilNewMoon(date: Date = new Date()): number {
  const data = calculateMoonPhase(date)
  return Math.ceil(
    (data.nextNewMoon.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  )
}

/**
 * 次の満月まで何日かを返す（小数点以下切り上げ）
 */
export function daysUntilFullMoon(date: Date = new Date()): number {
  const data = calculateMoonPhase(date)
  return Math.ceil(
    (data.nextFullMoon.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  )
}

/**
 * 月齢を 0〜29.5 の数値で返す
 */
export function getMoonAge(date: Date = new Date()): number {
  const diffDays =
    (date.getTime() - BASE_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24)
  return ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
}
