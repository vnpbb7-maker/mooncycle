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

/**
 * 2026-07-14 10:57 UTC の新月を基準点とする
 * （Star Walk で照明 0.9%、月齢 0.89 日と一致確認済み）
 */
const BASE_NEW_MOON = new Date('2026-07-14T10:57:00Z')

/** 朔望月（新月→新月）の日数 */
const SYNODIC_MONTH = 29.530588853

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

// ── 月星座の今日の影響文 ─────────────────────────────────────────────────────
export const MOON_SIGN_INFLUENCE: Record<string, {
  ja: { mood: string; advice: string }
  zh: { mood: string; advice: string }
}> = {
  '牡羊座': {
    ja: { mood: '行動・衝動・情熱が高まる日', advice: '思い立ったらすぐ動く。ただし短気に注意。' },
    zh: { mood: '行動力旺盛、衝動與熱情高漲', advice: '想到就去做。但注意別衝動行事。' },
  },
  '牡牛座': {
    ja: { mood: '感覚・安定・ゆっくりな日', advice: '五感を大切に。美味しいものや心地よい空間が吉。' },
    zh: { mood: '重視感官享受、渴望穩定', advice: '享受美食與舒適空間。慢慢來。' },
  },
  '双子座': {
    ja: { mood: '情報収集・コミュニケーションの日', advice: '人と話す・学ぶ・書くが捗る。気が散りやすいので注意。' },
    zh: { mood: '溝通順暢、資訊流通活躍', advice: '適合交流、學習、寫作。注意分心。' },
  },
  '蟹座': {
    ja: { mood: '感情的・家庭的・内向きな日', advice: '家で過ごす・大切な人と繋がる。感情の波に乗って。' },
    zh: { mood: '情感豐富、渴望歸屬感', advice: '待在家、與親近的人相處。順著感受走。' },
  },
  '獅子座': {
    ja: { mood: '表現・創造・自己発信の日', advice: '人前に出る・作る・楽しむ。自分を輝かせて。' },
    zh: { mood: '渴望表現自我、創造力高漲', advice: '展現自己、創作、享樂。讓自己發光。' },
  },
  '乙女座': {
    ja: { mood: '分析・整理・細部が気になる日', advice: '掃除・整理・計画に最適。完璧主義になりすぎず。' },
    zh: { mood: '注重細節、分析力強', advice: '適合整理、計劃。別太追求完美。' },
  },
  '天秤座': {
    ja: { mood: '調和・対話・美を求める日', advice: '人間関係を大切に。迷いやすい日なので直感を信じて。' },
    zh: { mood: '重視和諧與美感、渴望連結', advice: '珍視人際關係。容易猶豫，相信直覺。' },
  },
  '蠍座': {
    ja: { mood: '深掘り・変容・直感が鋭い日', advice: '表面より本質を見る。感情を深く感じる日。' },
    zh: { mood: '洞察力強、感受深刻', advice: '看透表象，觸及本質。深刻感受情感。' },
  },
  '射手座': {
    ja: { mood: '自由・冒険・哲学的な日', advice: '新しい場所や考え方に触れる。視野を広げて。' },
    zh: { mood: '嚮往自由、冒險心旺盛', advice: '接觸新地方或新想法。開闊視野。' },
  },
  '山羊座': {
    ja: { mood: '仕事・規律・現実的な日', advice: '計画を進める・目標に集中。着実に積み上げて。' },
    zh: { mood: '務實、重視目標與紀律', advice: '推進計畫、專注目標。踏實累積。' },
  },
  '水瓶座': {
    ja: { mood: '革新・独自性・ドライな日', advice: '既存の枠を超えるアイデアが浮かびやすい。独自路線で。' },
    zh: { mood: '重視創新與獨特性', advice: '容易湧現突破性想法。走自己的路。' },
  },
  '魚座': {
    ja: { mood: '感受性・直感・境界が溶ける日', advice: '人混みや消耗する環境を避けて。静かな時間が◎。' },
    zh: { mood: '感受性強、直覺敏銳、界線模糊', advice: '避開人潮與消耗性環境。享受靜謐時光。' },
  },
}
