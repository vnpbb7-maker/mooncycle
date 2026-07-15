'use client'

import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { useState, useEffect } from 'react'
import {
  calculateMoonPhase,
  daysUntilFullMoon,
  daysUntilNewMoon,
} from '@/lib/moon-phase'
import type { MoonPhase, MoonPhaseData } from '@/lib/moon-phase'
import { LENORMAND_CARDS } from '@/lib/cards'
import type { LenormandCard } from '@/lib/cards'
import { useLocale } from '@/lib/i18n'
import { calculateBazi, getYongShen } from '@/lib/bazi'
import type { BaziResult } from '@/lib/bazi'

// ── パレット定数 ───────────────────────────────────────────────────────────
const C = {
  bg:       '#1a1508',
  bgCard:   '#1e1a08',
  bgDeep:   '#120f05',
  gold:     '#c4a060',
  goldLt:   '#e8dcc8',
  goldMt:   '#8a7a60',
  goldDim:  '#6a5a40',
  bdr:      'rgba(196,160,96,0.18)',
  bdrSt:    'rgba(196,160,96,0.40)',
  bdrSub:   'rgba(196,160,96,0.08)',
  serif:    'Georgia, "Hiragino Mincho ProN", "Yu Mincho", serif',
  sans:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const

// ═══════════════════════════════════════════════════════════════════════════
// 月相 SVG
// ═══════════════════════════════════════════════════════════════════════════

const WAXING_PHASES: MoonPhase[] = [
  'newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
]

function getLitPath(
  illumination: number,
  phase: MoonPhase,
  r: number,
  cx: number,
  cy: number,
): string {
  if (illumination < 0.02) return ''
  if (illumination > 0.98) {
    // 満月: 2本のアークで完全円
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`
  }
  const termX = r * Math.abs(1 - 2 * illumination)
  const isWaxing = WAXING_PHASES.includes(phase)
  if (isWaxing) {
    const sweep = illumination > 0.5 ? 1 : 0
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${termX} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`
  } else {
    const sweep = illumination > 0.5 ? 0 : 1
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${termX} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`
  }
}

function MoonSVG({
  illumination,
  phase,
  size = 160,
}: {
  illumination: number
  phase: MoonPhase
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 8
  const litPath = getLitPath(illumination, phase, r, cx, cy)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`月相: 輝面比 ${Math.round(illumination * 100)}%`}
    >
      <defs>
        <radialGradient id="moonGrad" cx="38%" cy="38%" r="60%">
          <stop offset="0%"   stopColor="#f4eee0" />
          <stop offset="45%"  stopColor="#c4a060" />
          <stop offset="100%" stopColor="#6a4a20" />
        </radialGradient>
        <filter id="moonGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="moon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* 暗い月盤 */}
      <circle cx={cx} cy={cy} r={r} fill="#0d0b04" />

      {/* 輝面 */}
      {litPath && (
        <path
          d={litPath}
          fill="url(#moonGrad)"
          clipPath="url(#moon-clip)"
          filter={illumination > 0.65 ? 'url(#moonGlow)' : undefined}
        />
      )}

      {/* リング */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={C.bdr}
        strokeWidth="1"
      />

      {/* 満月時の外側グロー */}
      {illumination > 0.88 && (
        <circle
          cx={cx} cy={cy} r={r + 7}
          fill="none"
          stroke="rgba(196,160,96,0.12)"
          strokeWidth="5"
        />
      )}
    </svg>
  )
}

// ─── 情報カード ──────────────────────────────────────────────────────────────
function InfoCard({
  label,
  value,
  compact,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.bdr}`,
        borderRadius: '10px',
        padding: '10px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '9px',
          color: C.goldMt,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '5px',
          fontFamily: C.sans,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: compact ? '11px' : '15px',
          color: C.goldLt,
          fontFamily: compact ? C.sans : C.serif,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── 月相ウィジェット ─────────────────────────────────────────────────────────

const PHASE_LABELS_ZH: Record<string, string> = {
  '新月': '新月',
  '三日月': '峨眉月',
  '上弦の月': '上弦月',
  '十三夜': '盈凸月',
  '満月': '満月',
  '十六夜': '虧凸月',
  '下弦の月': '下弦月',
  '晦月': '残月',
}

const THEME_ZH: Record<string, string> = {
  '種まき・新たな始まり': '播種・全新開始',
  '意図を育てる・引き寄せ': '培育意図・吸引',
  '行動・決断・挑戦': '行動・決断・挑戦',
  '洗練・調整・継続': '精練・調整・継続',
  '完成・感謝・解放': '完成・感謝・釈放',
  '分かち合い・感謝を広げる': '分享・拡散感謝',
  '手放し・浄化・整理': '釈放・浄化・整理',
  '休息・内省・次への準備': '休息・内省・為下一步準備',
}

function MoonWidget({
  moon,
  daysToFull,
  daysToNew,
}: {
  moon: MoonPhaseData
  daysToFull: number
  daysToNew: number
}) {
  const { locale } = useLocale()
  const isZh = locale === 'zh-TW'
  const phaseLabel = isZh ? (PHASE_LABELS_ZH[moon.phaseLabel] ?? moon.phaseLabel) : moon.phaseLabel
  const theme      = isZh ? (THEME_ZH[moon.theme]             ?? moon.theme)       : moon.theme
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      {/* SVG + emoji */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <MoonSVG illumination={moon.illumination} phase={moon.phase} size={170} />
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '-2px',
            fontSize: '22px',
          }}
        >
          {moon.phaseEmoji}
        </span>
      </div>

      {/* 月相名 */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: C.serif,
            fontSize: '22px',
            color: C.gold,
            letterSpacing: '0.06em',
            marginBottom: '4px',
          }}
        >
          {phaseLabel}
        </div>
        <div
          style={{
            fontFamily: C.sans,
            fontSize: '11px',
            color: C.goldMt,
          }}
        >
          {isZh ? '月亮亮度' : '輝面比'}　{Math.round(moon.illumination * 100)}%
        </div>
      </div>

      {/* 4分割情報グリッド */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          width: '100%',
          maxWidth: '300px',
        }}
      >
        <InfoCard label={isZh ? '月亮星座' : '月星座'} value={moon.moonSign} />
        <InfoCard label={isZh ? '下次滿月' : '次の満月'} value={isZh ? `還有${daysToFull}天` : `あと ${daysToFull}日`} />
        <InfoCard label={isZh ? '下次新月' : '次の新月'} value={isZh ? `還有${daysToNew}天`  : `あと ${daysToNew}日`} />
        <InfoCard label={isZh ? '今日主題' : '今日のテーマ'} value={theme} compact />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Hero セクション
// ═══════════════════════════════════════════════════════════════════════════

function Hero({
  moon,
  daysToFull,
  daysToNew,
}: {
  moon: MoonPhaseData
  daysToFull: number
  daysToNew: number
}) {
  const { t, locale } = useLocale()
  const isZh = locale === 'zh-TW'
  const phaseLabel = isZh ? (PHASE_LABELS_ZH[moon.phaseLabel] ?? moon.phaseLabel) : moon.phaseLabel
  const theme      = isZh ? (THEME_ZH[moon.theme]             ?? moon.theme)       : moon.theme
  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* ── 左: テキスト ── */}
        <div>
          {/* フェーズバッジ */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 14px',
              background: 'rgba(196,160,96,0.08)',
              border: `1px solid ${C.bdrSt}`,
              borderRadius: '20px',
              fontFamily: C.sans,
              fontSize: '11px',
              color: C.gold,
              letterSpacing: '0.12em',
              marginBottom: '28px',
            }}
          >
            <span>{moon.phaseEmoji}</span>
            <span>TODAY · {phaseLabel.toUpperCase()}</span>
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: C.serif,
              fontSize: 'clamp(26px, 3.8vw, 46px)',
              fontWeight: 300,
              color: C.goldLt,
              lineHeight: 1.5,
              letterSpacing: '0.02em',
              marginBottom: '24px',
            }}
          >
            {t('home.title1')}
            <br />
            {t('home.title2')}
            <br />
            <span style={{ color: C.gold }}>{t('home.title3')}</span>
          </h1>

          {/* サブテキスト */}
          <p
            style={{
              fontFamily: C.sans,
              fontSize: '14px',
              color: C.goldMt,
              lineHeight: 1.9,
              marginBottom: '36px',
              maxWidth: '380px',
            }}
          >
            {t('home.sub')}
          </p>

          {/* CTA ボタン */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <PrimaryButton href="/reading">{t('home.cta1')}</PrimaryButton>
            <GhostButton href="/profile">{t('home.cta2')}</GhostButton>
          </div>

          {/* テーマ pill */}
          <div
            style={{
              marginTop: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: C.bgCard,
              border: `1px solid ${C.bdr}`,
              borderRadius: '10px',
            }}
          >
            <span
              style={{
                fontFamily: C.sans,
                fontSize: '10px',
                color: C.goldDim,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {isZh ? '今日主題' : '今日のテーマ'}
            </span>
            <span
              style={{
                fontFamily: C.serif,
                fontSize: '14px',
                color: C.goldLt,
              }}
            >
              {theme}
            </span>
          </div>

          {/* ── SP用 月情報ピル（PCは月ウィジェット補助）── */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '16px',
            }}
          >
            {/* 月相 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(196,160,96,0.07)',
              border: '0.5px solid rgba(196,160,96,0.22)',
              borderRadius: '99px',
              padding: '5px 12px',
              fontFamily: C.sans, fontSize: '12px', color: C.gold,
            }}>
              <span>{moon.phaseEmoji}</span>
              <span>{phaseLabel}</span>
            </div>

            {/* 月星座 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(196,160,96,0.07)',
              border: '0.5px solid rgba(196,160,96,0.22)',
              borderRadius: '99px',
              padding: '5px 12px',
              fontFamily: C.sans, fontSize: '12px', color: C.gold,
            }}>
              <span>⭐</span>
              <span>{isZh ? '月亮星座' : '月星座'}：{moon.moonSign}</span>
            </div>

            {/* 次の満月 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(196,160,96,0.07)',
              border: '0.5px solid rgba(196,160,96,0.22)',
              borderRadius: '99px',
              padding: '5px 12px',
              fontFamily: C.sans, fontSize: '12px', color: C.goldMt,
            }}>
              <span>🌕</span>
              <span>
                {isZh
                  ? `滿月：還有${daysToFull}天`
                  : `満月：あと${daysToFull}日`}
              </span>
            </div>
          </div>
        </div>

        {/* ── 右: 月相ウィジェット（PC のみ）── */}
        <div
          className="hidden md:flex justify-center"
          style={{ paddingLeft: '20px' }}
        >
          <MoonWidget moon={moon} daysToFull={daysToFull} daysToNew={daysToNew} />
        </div>
      </div>
    </section>
  )
}

// ── ボタン共通 ───────────────────────────────────────────────────────────────
function PrimaryButton({ children, href }: { children: React.ReactNode; href?: string }) {
  const [h, setH] = useState(false)
  const btn = (
    <button
      style={{
        fontFamily: C.sans,
        padding: '12px 28px',
        background: h ? '#d4b070' : C.gold,
        border: 'none',
        borderRadius: '8px',
        color: C.bg,
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.15s',
        transform: h ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {children}
    </button>
  )
  if (href) return <a href={href} style={{ textDecoration: 'none' }}>{btn}</a>
  return btn
}

function GhostButton({ children, href }: { children: React.ReactNode; href?: string }) {
  const [h, setH] = useState(false)
  const btn = (
    <button
      style={{
        fontFamily: C.sans,
        padding: '12px 28px',
        background: h ? 'rgba(196,160,96,0.08)' : 'transparent',
        border: `1px solid ${h ? C.bdrSt : C.bdr}`,
        borderRadius: '8px',
        color: C.gold,
        fontSize: '13px',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {children}
    </button>
  )
  if (href) return <a href={href} style={{ textDecoration: 'none' }}>{btn}</a>
  return btn
}

// ═══════════════════════════════════════════════════════════════════════════
// 日付シード（今日の6枚）
// ═══════════════════════════════════════════════════════════════════════════

const DAILY_POSITIONS_JA = [
  { label: '今日のメッセージ',   desc: '今日あなたへ届く核心的なメッセージ' },
  { label: '今月のテーマ',       desc: '今月全体を流れるエネルギー' },
  { label: '注意点',             desc: '今日意識しておきたいこと' },
  { label: '隠れた力',           desc: '気づいていないあなたの強み' },
  { label: '宇宙からのヒント',   desc: '月のエネルギーからの導き' },
  { label: '今週の流れ',         desc: 'この一週間のエネルギーの方向性' },
]
const DAILY_POSITIONS_ZH = [
  { label: '今日訊息',   desc: '今天傳達給你的核心訊息' },
  { label: '本月主題',   desc: '流貫整個月份的能量' },
  { label: '注意事項',   desc: '今天需要意識到的事' },
  { label: '隱藏力量',   desc: '你尚未察覺的優勢' },
  { label: '宇宙提示',   desc: '來自月亮能量的引導' },
  { label: '本週流向',   desc: '這一週能量的方向性' },
]

function getDailyCards(): LenormandCard[] {
  const today = new Date()
  const seed  =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate()
  const shuffled = [...LENORMAND_CARDS].sort((a, b) => {
    const hashA = (a.id * seed * 2654435761) % 36
    const hashB = (b.id * seed * 2654435761) % 36
    return hashA - hashB
  })
  return shuffled.slice(0, 6) as unknown as LenormandCard[]
}

// ═══════════════════════════════════════════════════════════════════════════
// カードデッキセクション
// ═══════════════════════════════════════════════════════════════════════════

function CardItem({
  card,
  index,
  position,
  locale,
  badge,
}: {
  card: LenormandCard
  index: number
  position: { label: string; desc: string }
  locale: string
  badge?: { label: string; color: string } | null
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [hovered, setHovered] = useState(false)

  const isZh = locale === 'zh-TW'
  const c = card as unknown as Record<string, string>
  const cardName    = isZh ? (c.nameZhTW    ?? card.nameJa)  : card.nameJa
  const cardKeyword = isZh ? (c.keywordZhTW ?? card.keyword)  : card.keyword
  const cardMeaning = isZh ? (c.meaningZhTW ?? card.meaning)  : card.meaning

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* カード本体 */}
      <div
        style={{
          aspectRatio: '2 / 3',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${hovered ? C.gold : C.bdr}`,
          background: `linear-gradient(160deg, #2a2210 0%, ${C.bgCard} 60%, #161204 100%)`,
          transition: 'border-color 0.25s',
          boxShadow: hovered
            ? '0 16px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,160,96,0.2)'
            : '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* 用神/忌神バッジ */}
        {badge && (
          <div style={{
            position: 'absolute', top: '6px', left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px', color: badge.color,
            background: 'rgba(26,21,8,0.88)',
            padding: '2px 7px', borderRadius: '99px',
            border: `0.5px solid ${badge.color}`,
            whiteSpace: 'nowrap', zIndex: 10,
            fontFamily: C.sans, letterSpacing: '0.03em',
            pointerEvents: 'none',
          }}>
            {badge.label}
          </div>
        )}
        {/* next/image (画像がある場合) */}
        {!imgError && (
          <Image
            src={`/cards/${card.file}`}
            alt={cardName}
            fill
            className="object-cover"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 25vw, 16vw"
          />
        )}

        {/* プレースホルダー（画像なし or 読込中） */}
        {(imgError || !imgLoaded) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 8px',
            }}
          >
            <span
              style={{
                fontFamily: C.sans,
                fontSize: '10px',
                color: 'rgba(196,160,96,0.4)',
                letterSpacing: '0.1em',
              }}
            >
              {String(card.id).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: C.serif,
                fontSize: 'clamp(13px, 1.8vw, 17px)',
                color: C.goldMt,
                textAlign: 'center',
                letterSpacing: '0.05em',
              }}
            >
              {cardName}
            </span>
            <span
              style={{
                fontFamily: C.sans,
                fontSize: '8px',
                color: 'rgba(196,160,96,0.35)',
                textAlign: 'center',
                letterSpacing: '0.06em',
                lineHeight: 1.6,
              }}
            >
              {cardKeyword.split('・').join('\n')}
            </span>
          </div>
        )}
      </div>

      {/* カード情報（カード下） */}
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* ポジション名 */}
        <div style={{
          fontFamily: C.sans,
          fontSize: '9px',
          color: '#a09070',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          {position.label}
        </div>
        {/* カード名 */}
        <div style={{
          fontFamily: C.serif,
          fontSize: 'clamp(11px, 1.4vw, 13px)',
          color: C.goldLt,
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          {cardName}
          <span style={{ color: C.goldDim, fontSize: '9px', marginLeft: '4px' }}>{card.name}</span>
        </div>
        {/* キーワード */}
        <div style={{
          fontFamily: C.sans,
          fontSize: '9px',
          color: C.goldMt,
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {cardKeyword}
        </div>
        {/* 一言メッセージ */}
        <div style={{
          fontFamily: C.sans,
          fontSize: '10px',
          color: C.goldDim,
          textAlign: 'center',
          lineHeight: 1.6,
          marginTop: '2px',
        }}>
          {cardMeaning}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Lenormand セクション (Hero + TodayCardsの間)
// ═══════════════════════════════════════════════════════════════════════════

function LenormandSection() {
  const { t } = useLocale()

  const methods = [
    { icon: '🃏', title: t('lenormand.method1_title'), titleSub: t('lenormand.method1_sub'), body: t('lenormand.method1_desc') },
    { icon: '🔗', title: t('lenormand.method2_title'), titleSub: t('lenormand.method2_sub'), body: t('lenormand.method2_desc') },
    { icon: '✨', title: t('lenormand.method3_title'), titleSub: t('lenormand.method3_sub'), body: t('lenormand.method3_desc') },
  ]

  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(40px, 6vw, 64px) clamp(16px, 4vw, 32px) 0',
        borderTop: `1px solid ${C.bdrSub}`,
      }}
    >
      <SectionLabel>ABOUT LENORMAND</SectionLabel>
      <h2
        style={{
          fontFamily: C.serif,
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 300,
          color: C.gold,
          marginBottom: '12px',
        }}
      >
        {t('lenormand.title')}
      </h2>
      <p
        style={{
          fontFamily: C.sans,
          fontSize: '13px',
          color: C.goldMt,
          lineHeight: 1.9,
          maxWidth: '560px',
          marginBottom: '32px',
        }}
      >
        {t('lenormand.desc')}
      </p>

      {/* 3つの読み方カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '0' }}>
        {methods.map(item => (
          <div
            key={item.title}
            style={{
              background: C.bgCard,
              border: `1px solid ${C.bdr}`,
              borderRadius: '14px',
              padding: '20px 22px',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</div>
            <div style={{ fontFamily: C.serif, fontSize: '15px', color: C.goldLt, marginBottom: '2px' }}>
              {item.title}
            </div>
            <div style={{
              fontFamily: C.sans, fontSize: '10px',
              color: C.goldDim, letterSpacing: '0.1em',
              marginBottom: '10px',
            }}>
              {item.titleSub}
            </div>
            <p style={{
              fontFamily: C.sans,
              fontSize: '12px',
              color: C.goldMt,
              lineHeight: 1.85,
              whiteSpace: 'pre-line',
            }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── 五行×カード対応マップ ──────────────────────────────────────────────────
const CARD_ELEMENT: Record<number, string> = {
  // wood: 成長・希望・始まり系
  5: 'wood', 9: 'wood', 13: 'wood', 17: 'wood', 20: 'wood',
  // fire: 情熱・表現・成功系
  31: 'fire', 16: 'fire', 24: 'fire',
  // earth: 安定・家・基盤系
  4: 'earth', 15: 'earth', 19: 'earth', 35: 'earth',
  // metal: 決断・切断・収穫系
  10: 'metal', 33: 'metal', 25: 'metal',
  // water: 直感・変容・流れ系
  32: 'water', 3: 'water', 34: 'water', 7: 'water',
}

// ═══════════════════════════════════════════════════════════════════════════
// TodayCards セクション
// ═══════════════════════════════════════════════════════════════════════════

function TodayCardsSection({ cards }: { cards: LenormandCard[] }) {
  const { t, locale } = useLocale()
  const isZh = locale === 'zh-TW'
  const DAILY_POSITIONS = isZh ? DAILY_POSITIONS_ZH : DAILY_POSITIONS_JA

  // 命式（localStorage から取得）
  const [baziForCards, setBaziForCards] = useState<BaziResult | null>(null)
  useEffect(() => {
    try {
      const profileStr = localStorage.getItem('mooncycle_profile')
      if (profileStr) {
        const profile = JSON.parse(profileStr)
        if (profile?.birthDate) {
          const birth = new Date(profile.birthDate)
          setBaziForCards(calculateBazi(birth, profile.birthHour ?? 12))
        }
      }
    } catch { /* ignore */ }
  }, [])

  // 用神・忌神バッジ判定
  const getCardBadge = (cardId: number): { label: string; color: string } | null => {
    if (!baziForCards) return null
    const cardElem = CARD_ELEMENT[cardId]
    if (!cardElem) return null
    const { yongShenElem, jiShenElem } = getYongShen(baziForCards)
    if (cardElem === yongShenElem) return {
      label: isZh ? '✦ 今日特別重要' : '✦ 今日特に重要',
      color: '#c4a060',
    }
    if (cardElem === jiShenElem) return {
      label: isZh ? '△ 注意' : '△ 注意',
      color: '#c06060',
    }
    return null
  }

  return (
    <section
      id="deck"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(40px, 6vw, 72px) clamp(16px, 4vw, 32px)',
      }}
    >
      <SectionLabel>{t('todayCards.label')}</SectionLabel>
      <h2
        style={{
          fontFamily: C.serif,
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 300,
          color: C.goldLt,
          marginBottom: '8px',
        }}
      >
        {t('todayCards.label')}
      </h2>
      <p
        style={{
          fontFamily: C.sans,
          fontSize: '13px',
          color: C.goldMt,
          marginBottom: '40px',
        }}
      >
        {t('todayCards.sub')}
      </p>

      {/* グリッド: PC=6列, SP=2列 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-5">
        {cards.map((card, i) => (
          <CardItem
            key={card.id}
            card={card}
            index={i}
            locale={locale}
            position={DAILY_POSITIONS[i] ?? { label: '', desc: '' }}
            badge={getCardBadge(card.id)}
          />
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// リーディングスプレッドセクション
// ═══════════════════════════════════════════════════════════════════════════

const getHomeSpreads = (locale: string) => [
  { id: 'daily',         name: locale === 'zh-TW' ? '單張抽牌'    : '1枚引き',          nameEn: 'ONE CARD',      desc: locale === 'zh-TW' ? '簡單接收今日訊息。相信直覺選擇牌卡。'                                 : '今日のメッセージをシンプルに受け取る。直感を信じてカードを選ぶ。',                              cards: 1,  premium: false, emoji: '🌙', badge: null,                                                count: locale === 'zh-TW' ? '1張'  : '1枚スプレッド'  },
  { id: 'three',         name: locale === 'zh-TW' ? '三張抽牌'    : '3枚引き',          nameEn: 'THREE CARDS',   desc: locale === 'zh-TW' ? '用三張牌解讀過去・現在・未來的流向。俯瞰時間軸。'                      : '過去・現在・未来の流れを3枚で読み解く。時間軸を俯瞰する。',                                      cards: 3,  premium: false, emoji: '✨', badge: null,                                                count: locale === 'zh-TW' ? '3張'  : '3枚スプレッド'  },
  { id: 'fullmoon',      name: locale === 'zh-TW' ? '滿月牌陣'    : '満月スプレッド',   nameEn: 'FULL MOON',     desc: locale === 'zh-TW' ? '照亮應該釋放之物的5張牌解讀。感謝與釋放的儀式。'                      : '手放すべきものを照らす5枚のリーディング。感謝と解放の儀式。',                                  cards: 5,  premium: true,  emoji: '🌕', badge: null,                                                count: locale === 'zh-TW' ? '5張'  : '5枚スプレッド'  },
  { id: 'newmoon',       name: locale === 'zh-TW' ? '新月牌陣'    : '新月スプレッド',   nameEn: 'NEW MOON',      desc: locale === 'zh-TW' ? '面向新開始的5張意圖設定。播種時期的指引。'                            : '新しい始まりに向けた5枚の意図設定。種を植える時期の指針。',                                      cards: 5,  premium: true,  emoji: '🌑', badge: null,                                                count: locale === 'zh-TW' ? '5張'  : '5枚スプレッド'  },
  { id: 'relation',      name: locale === 'zh-TW' ? '關係牌陣'    : '関係性スプレッド', nameEn: 'RELATIONSHIP',  desc: locale === 'zh-TW' ? '用7張牌探索兩人之間的能量與可能性。觸及連結的本質。'                    : '二者間のエネルギーと可能性を7枚で探る。つながりの本質へ。',                                    cards: 7,  premium: true,  emoji: '💫', badge: null,                                                count: locale === 'zh-TW' ? '7張'  : '7枚スプレッド'  },
  { id: 'celtic',        name: locale === 'zh-TW' ? '凱爾特十字'  : 'ケルト十字',       nameEn: 'CELTIC CROSS',  desc: locale === 'zh-TW' ? '用10張牌深度解讀整體狀況。回答一切問題。'                               : '総合的な状況を10枚で深く読み解く。あらゆる問いへの答え。',                                      cards: 10, premium: true,  emoji: '⭐', badge: null,                                                count: locale === 'zh-TW' ? '10張' : '10枚スプレッド' },
  { id: 'small-table',   name: locale === 'zh-TW' ? '小桌牌陣'    : '小テーブル',       nameEn: 'SMALL TABLE',   desc: locale === 'zh-TW' ? '用9張牌立體解讀狀況的中級牌陣。以中心牌為軸上下左右解讀。'               : '9枚で状況を立体的に読む中級スプレッド。中心カードを軸に上下左右で読む。',                      cards: 9,  premium: true,  emoji: '🔲', badge: null,                                                count: locale === 'zh-TW' ? '9張'  : '9枚スプレッド'  },
  { id: 'grand-tableau', name: locale === 'zh-TW' ? '大牌陣'      : 'グランタブロー',   nameEn: 'GRAND TABLEAU', desc: locale === 'zh-TW' ? '全36張展開・俯瞰人生全局的正統解讀。工作・愛情・健康・金錢全面涵蓋。'      : '全36枚展開・人生全体を俯瞰する本格リーディング。仕事・恋愛・健康・お金を網羅。',            cards: 36, premium: true,  emoji: '✨', badge: locale === 'zh-TW' ? '🌟 最頂級' : '🌟 最上位', count: locale === 'zh-TW' ? '36張' : '36枚スプレッド' },
]

function SpreadCard({ spread }: { spread: ReturnType<typeof getHomeSpreads>[number] }) {
  const [hovered, setHovered] = useState(false)
  const { t } = useLocale()

  return (
    <a
      href={`/reading?spread=${spread.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: hovered ? 'linear-gradient(135deg, #231e09, #1e1a08)' : C.bgCard,
        border: `1px solid ${hovered ? C.bdrSt : C.bdr}`,
        borderRadius: '14px', padding: '24px', cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${C.bdrSt}` : 'none',
        position: 'relative',
      }}
    >
      {/* バッジ: カスタム > PREMIUM > FREE */}
      {spread.badge ? (
        <div style={{ position: 'absolute', top: '14px', right: '14px', fontFamily: C.sans, fontSize: '9px', color: '#c4a060', background: 'rgba(196,160,96,0.15)', border: '1px solid rgba(196,160,96,0.4)', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.08em', pointerEvents: 'none' }}>
          {spread.badge}
        </div>
      ) : spread.premium ? (
        <div style={{ position: 'absolute', top: '14px', right: '14px', fontFamily: C.sans, fontSize: '9px', color: C.gold, background: 'rgba(196,160,96,0.1)', border: `1px solid ${C.bdr}`, borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.1em', pointerEvents: 'none' }}>
          {t('reading.premium')}
        </div>
      ) : (
        <div style={{ position: 'absolute', top: '14px', right: '14px', fontFamily: C.sans, fontSize: '9px', color: '#6a9060', background: 'rgba(100,140,90,0.1)', border: '1px solid rgba(100,140,90,0.25)', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.1em', pointerEvents: 'none' }}>
          {t('reading.free')}
        </div>
      )}

      <div style={{ fontSize: '28px', marginBottom: '14px', pointerEvents: 'none' }}>{spread.emoji}</div>
      <div style={{ fontFamily: C.sans, fontSize: '9px', color: C.goldDim, letterSpacing: '0.14em', marginBottom: '6px', textTransform: 'uppercase', pointerEvents: 'none' }}>
        {spread.nameEn}
      </div>
      <h3 style={{ fontFamily: C.serif, fontSize: '17px', fontWeight: 400, color: hovered ? C.gold : C.goldLt, letterSpacing: '0.04em', marginBottom: '10px', transition: 'color 0.25s', pointerEvents: 'none' }}>
        {spread.name}
      </h3>
      <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.75, marginBottom: '16px', pointerEvents: 'none' }}>
        {spread.desc}
      </p>
      <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.08em', pointerEvents: 'none' }}>
        {spread.count}
      </div>
    </a>
  )
}

function ReadingSpreads() {
  const { t, locale } = useLocale()
  const spreads = getHomeSpreads(locale)
  return (
    <section
      id="reading"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(40px, 6vw, 72px) clamp(16px, 4vw, 32px)',
        borderTop: `1px solid ${C.bdrSub}`,
      }}
    >
      <SectionLabel>READING</SectionLabel>
      <h2
        style={{
          fontFamily: C.serif,
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 300,
          color: C.goldLt,
          marginBottom: '8px',
        }}
      >
        {t('reading.title')}
      </h2>
      <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, marginBottom: '40px' }}>
        {t('reading.sub')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {spreads.map(spread => (
          <SpreadCard key={spread.id} spread={spread} />
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// セクションラベル共通
// ═══════════════════════════════════════════════════════════════════════════

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.gold, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {children}
      </div>
      <div style={{ flex: 1, height: '1px', background: C.bdrSub }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// フッター
// ═══════════════════════════════════════════════════════════════════════════

function Footer() {
  const { t } = useLocale()
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.bdrSub}`,
        backgroundColor: C.bgDeep,
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)',
        marginTop: 'clamp(32px, 6vw, 64px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: C.serif, fontSize: '16px', color: C.gold, letterSpacing: '0.08em', marginBottom: '4px' }}>
            🌙 MoonCycle
          </div>
          <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim }}>
            {t('footer.copyright')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: t('footer.privacy'), href: '#' },
            { label: t('footer.terms'), href: '#' },
            { label: t('footer.contact'), href: '#' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, textDecoration: 'none', letterSpacing: '0.04em', transition: 'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.gold }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.goldDim }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page (デフォルトエクスポート)
// ═══════════════════════════════════════════════════════════════════════════

export default function Page() {
  const [moon, setMoon]             = useState<MoonPhaseData | null>(null)
  const [daysToFull, setDaysToFull] = useState(0)
  const [daysToNew, setDaysToNew]   = useState(0)
  const [displayCards, setDisplayCards] = useState<LenormandCard[]>(
    LENORMAND_CARDS.slice(0, 6) as unknown as LenormandCard[],
  )

  useEffect(() => {
    setMoon(calculateMoonPhase())
    setDaysToFull(daysUntilFullMoon())
    setDaysToNew(daysUntilNewMoon())
    setDisplayCards(getDailyCards())
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />

      {/* Hero */}
      {moon ? (
        <Hero moon={moon} daysToFull={daysToFull} daysToNew={daysToNew} />
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: C.serif, fontSize: '18px', color: C.goldMt, letterSpacing: '0.1em', animation: 'pulse 2s ease-in-out infinite' }}>
            🌙 読み込み中...
          </div>
        </div>
      )}

      <LenormandSection />
      <TodayCardsSection cards={displayCards} />
      <ReadingSpreads />
      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

