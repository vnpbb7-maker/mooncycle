'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Navbar from '@/components/Navbar'
import { useLocale } from '@/lib/i18n'
import { calculateMoonPhase } from '@/lib/moon-phase'
import type { MoonPhaseData } from '@/lib/moon-phase'
import { LENORMAND_CARDS } from '@/lib/cards'
import type { LenormandCard } from '@/lib/cards'
import {
  canUseAiReading,
  canUsePremiumSpread,
  incrementAiReadingCount,
  getSubscription,
} from '@/lib/subscription'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08', bgDeep: '#120f05',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

const getSpreads = (locale: string) => [
  {
    id: 'daily',
    name: locale === 'zh-TW' ? '單張抽牌' : '1枚引き',
    nameEn: 'ONE CARD',
    desc: locale === 'zh-TW'
      ? '簡單接收今日訊息。相信直覺選擇牌卡。'
      : '今日のメッセージをシンプルに受け取る。直感を信じてカードを選ぶ。',
    cards: 1, free: true, icon: '🌙',
    cardCount: locale === 'zh-TW' ? '1張牌陣' : '1枚スプレッド',
  },
  {
    id: 'three',
    name: locale === 'zh-TW' ? '三張抽牌' : '3枚引き',
    nameEn: 'THREE CARDS',
    desc: locale === 'zh-TW'
      ? '用三張牌解讀過去・現在・未來的流向。俯瞰時間軸。'
      : '過去・現在・未来の流れを3枚で読み解く。時間軸を俯瞰する。',
    cards: 3, free: true, icon: '✦',
    cardCount: locale === 'zh-TW' ? '3張牌陣' : '3枚スプレッド',
  },
  {
    id: 'fullmoon',
    name: locale === 'zh-TW' ? '滿月牌陣' : '満月スプレッド',
    nameEn: 'FULL MOON',
    desc: locale === 'zh-TW'
      ? '照亮應該釋放之物的5張牌解讀。感謝與釋放的儀式。'
      : '手放すべきものを照らす5枚のリーディング。感謝と解放の儀式。',
    cards: 5, free: false, icon: '🌕',
    cardCount: locale === 'zh-TW' ? '5張牌陣' : '5枚スプレッド',
  },
  {
    id: 'newmoon',
    name: locale === 'zh-TW' ? '新月牌陣' : '新月スプレッド',
    nameEn: 'NEW MOON',
    desc: locale === 'zh-TW'
      ? '面向新開始的5張意圖設定。播種時期的指引。'
      : '新しい始まりに向けた5枚の意図設定。種を植える時期の指針。',
    cards: 5, free: false, icon: '🌑',
    cardCount: locale === 'zh-TW' ? '5張牌陣' : '5枚スプレッド',
  },
  {
    id: 'relation',
    name: locale === 'zh-TW' ? '關係牌陣' : '関係性スプレッド',
    nameEn: 'RELATIONSHIP',
    desc: locale === 'zh-TW'
      ? '用7張牌探索兩人之間的能量與可能性。觸及連結的本質。'
      : '二者間のエネルギーと可能性を7枚で探る。つながりの本質へ。',
    cards: 7, free: false, icon: '🪐',
    cardCount: locale === 'zh-TW' ? '7張牌陣' : '7枚スプレッド',
  },
  {
    id: 'celtic',
    name: locale === 'zh-TW' ? '凱爾特十字' : 'ケルト十字',
    nameEn: 'CELTIC CROSS',
    desc: locale === 'zh-TW'
      ? '用10張牌深度解讀整體狀況。回答一切問題。'
      : '総合的な状況を10枚で深く読み解く。あらゆる問いへの答え。',
    cards: 10, free: false, icon: '⭐',
    cardCount: locale === 'zh-TW' ? '10張牌陣' : '10枚スプレッド',
  },
  {
    id: 'small-table',
    name: locale === 'zh-TW' ? '小桌牌陣' : '小テーブル',
    nameEn: 'SMALL TABLE',
    desc: locale === 'zh-TW'
      ? '用9張牌立體解讀狀況的中級牌陣。以中心牌為軸上下左右解讀。'
      : '9枚で状況を立体的に読む中級スプレッド。中心カードを軸に上下左右に読む。',
    cards: 9, free: false, icon: '🔲',
    cardCount: locale === 'zh-TW' ? '9張牌陣' : '9枚スプレッド',
  },
  {
    id: 'grand-tableau',
    name: locale === 'zh-TW' ? '大牌陣' : 'グランタブロー',
    nameEn: 'GRAND TABLEAU',
    desc: locale === 'zh-TW'
      ? '全36張展開・俯瞰人生全局的正統解讀。工作・愛情・健康・金錢全面涵蓋。'
      : '全36枚展開・人生全体を俯瞰する本格リーディング。仕事・恋愛・健康・お金を網羅。',
    cards: 36, free: false, icon: '✨',
    cardCount: locale === 'zh-TW' ? '36張牌陣' : '36枚スプレッド',
  },
]

const POSITIONS_JA: Record<string, string[]> = {
  daily:       ['今日のメッセージ'],
  three:       ['過去', '現在', '未来'],
  fullmoon:    ['手放すもの', '隠れた理由', '解放後の姿', '月からのメッセージ'],
  newmoon:     ['願い', '実現への道', '障害', '月のサポート'],
  relation:    ['あなた', '相手', '二者の関係', '過去', '課題', '可能性'],
  celtic:      ['現在', '障害', '土台', '過去', '可能性'],
  'small-table': ['過去の影響', '現在の状況', '近い未来', '隠れた要因', '中心テーマ', 'アドバイス', '土台・基盤', '外部環境', '結果・結論'],
}
const POSITIONS_ZH: Record<string, string[]> = {
  daily:       ['今日訊息'],
  three:       ['過去', '現在', '未來'],
  fullmoon:    ['放下的事物', '隱藏的原因', '放下後的樣貌', '月亮的訊息'],
  newmoon:     ['心願', '實現之道', '障礙', '月亮的支持'],
  relation:    ['你', '對方', '雙方關係', '過去', '課題', '可能性'],
  celtic:      ['現在', '障礙', '基礎', '過去', '可能性'],
  'small-table': ['過去影響', '現在狀況', '近期未來', '隱藏因素', '核心主題', '建議', '基礎', '外部環境', '結果結論'],
}

type Spread = ReturnType<typeof getSpreads>[number]


// ── カード裏面 SVG ────────────────────────────────────────────────────────────
function CardBackSVG() {
  return (
    <svg
      viewBox="0 0 100 145"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
    >
      <rect width="100" height="145" rx="6" fill="#1e1a08" />
      <rect x="4" y="4" width="92" height="137" rx="4"
        fill="none" stroke="rgba(196,160,96,0.15)" strokeWidth="1"
      />
      {[16, 30, 43].map(r => (
        <circle key={r} cx="50" cy="72" r={r}
          stroke="rgba(196,160,96,0.22)" strokeWidth="0.8" fill="none"
        />
      ))}
      <circle cx="50" cy="72" r="3" fill="rgba(196,160,96,0.45)" />
      <line x1="50" y1="29" x2="50" y2="34" stroke="rgba(196,160,96,0.3)" strokeWidth="1" />
      <line x1="50" y1="110" x2="50" y2="115" stroke="rgba(196,160,96,0.3)" strokeWidth="1" />
      <line x1="7"  y1="72" x2="12" y2="72"  stroke="rgba(196,160,96,0.3)" strokeWidth="1" />
      <line x1="88" y1="72" x2="93" y2="72"  stroke="rgba(196,160,96,0.3)" strokeWidth="1" />
      {([[8,10],[92,10],[8,135],[92,135]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="none"
          stroke="rgba(196,160,96,0.18)" strokeWidth="0.8"
        />
      ))}
    </svg>
  )
}

// ── スプレッドアイコン ──────────────────────────────────────────────────────────
function SpreadIcon({ count }: { count: number }) {
  const W = 80, cw = 11
  const gap = count > 4 ? 2.5 : 5
  const totalW = count * cw + (count - 1) * gap
  const sx = (W - totalW) / 2
  return (
    <svg viewBox={`0 0 ${W} 28`} width={W} height={28}>
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={sx + i * (cw + gap)} y={4}
          width={cw} height={16} rx={2}
          fill="rgba(196,160,96,0.08)"
          stroke="rgba(196,160,96,0.28)" strokeWidth="0.8"
        />
      ))}
    </svg>
  )
}


// ─── アップセルモーダル ────────────────────────────────────────────────────────
function UpsellModal({ message, onClose }: { message: string; onClose: () => void }) {
  const router = useRouter()
  const { locale } = useLocale()
  const isZh = locale === 'zh-TW'
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e1a08', border: '1px solid rgba(196,160,96,0.4)',
          borderRadius: '16px', padding: '32px 28px',
          maxWidth: '400px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>✦</div>
        <h2 style={{ fontFamily: C.serif, fontSize: '20px', color: C.gold, marginBottom: '12px' }}>
          {isZh ? '升級方案' : 'プランのアップグレード'}
        </h2>
        <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, lineHeight: 1.8, marginBottom: '24px' }}>
          {message}
        </p>
        <button
          onClick={() => router.push('/premium')}
          style={{
            width: '100%', padding: '13px',
            background: C.gold, border: 'none', borderRadius: '10px',
            color: C.bg, fontFamily: C.sans, fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.06em', cursor: 'pointer', marginBottom: '10px',
          }}
        >
          {isZh ? '查看方案 →' : 'プランを見る →'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px',
            background: 'transparent', border: '1px solid rgba(196,160,96,0.18)',
            borderRadius: '10px', color: C.goldMt,
            fontFamily: C.sans, fontSize: '12px', cursor: 'pointer',
          }}
        >
          {isZh ? '關閉' : '閉じる'}
        </button>
      </div>
    </div>
  )
}

// ── フリップカード ────────────────────────────────────────────────────────────
function FlipCard({
  card, position, flipped, onClick, imgError, onImgError,
}: {
  card: LenormandCard
  position: string
  flipped: boolean
  onClick: () => void
  imgError: boolean
  onImgError: () => void
}) {
  const handleClick = () => {
    console.log('[FlipCard] clicked', card.nameJa, 'flipped=', flipped)
    onClick()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        fontFamily: C.sans, fontSize: '9px', color: C.goldMt,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {position}
      </div>

      {/* perspective 外枠 — height を明示しないと Safari で高さ0になる */}
      <div
        onClick={handleClick}
        style={{
          width: '88px',
          height: '132px', // 88 * 3/2
          perspective: '1000px',
          cursor: flipped ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        {/* フリップするインナー */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          // WebKit prefix が必須
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transition: 'transform 0.75s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        } as React.CSSProperties}>

          {/* 裏面 */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '8px', overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
          } as React.CSSProperties}>
            <CardBackSVG />
          </div>

          {/* 表面 */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '8px', overflow: 'hidden',
            border: `1px solid ${C.bdrSt}`,
            background: C.bgCard,
            boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
          } as React.CSSProperties}>
            {!imgError ? (
              <Image
                src={`/cards/${card.file}`} alt={card.nameJa}
                fill className="object-cover"
                onError={onImgError} sizes="88px"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px', gap: '8px',
              }}>
                <span style={{ fontFamily: C.serif, fontSize: '16px', color: C.goldMt, textAlign: 'center' }}>
                  {card.nameJa}
                </span>
                <span style={{ fontFamily: C.sans, fontSize: '8px', color: C.goldDim, textAlign: 'center', lineHeight: 1.6 }}>
                  {card.keyword}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* カード名（めくり後） */}
      <div style={{
        fontFamily: C.sans, fontSize: '9px', textAlign: 'center',
        maxWidth: '88px', lineHeight: 1.4,
        color: flipped ? C.gold : 'transparent',
        transition: 'color 0.4s 0.4s',
      }}>
        {card.nameJa}
      </div>
    </div>
  )
}



// ═══════════════════════════════════════════════════════════════════════════
// Inner page (needs useSearchParams → must be inside Suspense)
// ═══════════════════════════════════════════════════════════════════════════
function ReadingPageInner() {
  const searchParams = useSearchParams()
  const spreadParam  = searchParams.get('spread')
  const { t, locale } = useLocale()
  const isZhTW = locale === 'zh-TW'
  const SPREADS   = getSpreads(locale)
  const POSITIONS = isZhTW ? POSITIONS_ZH : POSITIONS_JA
  const [moon, setMoon] = useState<MoonPhaseData | null>(null)
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null)
  const [drawnCards, setDrawnCards] = useState<LenormandCard[]>([])
  const [flipped, setFlipped] = useState<boolean[]>([])
  const [imgErrors, setImgErrors] = useState<boolean[]>([])
  const [readingText, setReadingText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [upsellMsg, setUpsellMsg] = useState<string | null>(null)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [readyPhase, setReadyPhase] = useState(false)

  const READING_LOADING_MESSAGES = [
    t('reading.loading_msg1'),
    t('reading.loading_msg2'),
    t('reading.loading_msg3'),
    t('reading.loading_msg4'),
    t('reading.loading_msg5'),
  ]

  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % READING_LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isGenerating])

  // スプレッド選択
  const selectSpread = (spread: Spread) => {
    console.log('[ReadingPage] selectSpread clicked:', spread.id)
    if (!spread.free && !canUsePremiumSpread()) {
      setUpsellMsg(isZhTW
        ? '全部6種牌陣需要亮等以上方案才可使用。'
        : '六種スプレッドはライトプラン以上でご利用いただけます。')
      return
    }
    const shuffled = [...LENORMAND_CARDS].sort(() => Math.random() - 0.5)
    const cards = shuffled.slice(0, spread.cards) as unknown as LenormandCard[]
    setSelectedSpread(spread)
    setDrawnCards(cards)
    setFlipped(Array(spread.cards).fill(false))
    setImgErrors(Array(spread.cards).fill(false))
    setReadingText('')
    setIsGenerating(false)
    setReadyPhase(true)
  }

  // moon / URL param 初期化
  useEffect(() => { setMoon(calculateMoonPhase()) }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (spreadParam) {
      const found = SPREADS.find(s => s.id === spreadParam)
      if (found) selectSpread(found)
    }
  }, [spreadParam]) // selectSpread は毎回同じ参照のため安全

  const flipCard = useCallback((i: number) => {
    console.log('[ReadingPage] flipCard', i)
    setFlipped(prev => {
      const n = [...prev]
      n[i] = true
      console.log('[ReadingPage] new flipped state:', n)
      return n
    })
  }, [])

  const isGrandTableau = selectedSpread?.id === 'grand-tableau'
  const isSmallTable   = selectedSpread?.id === 'small-table'

  // グランタブローは最初から全枚表向き
  const allFlipped = isGrandTableau
    ? drawnCards.length === 36
    : flipped.length > 0 && flipped.every(Boolean)

  const generateReading = useCallback(async () => {
    if (!selectedSpread || !moon) return

    // AIリーディング制限チェック
    const check = canUseAiReading(selectedSpread?.id)
    if (!check.allowed) {
      setUpsellMsg(check.reason ?? (isZhTW
        ? 'AI解讀需要亮等以上方案才可使用。'
        : 'AIリーディングはライトプラン以上でご利用いただけます。'))
      return
    }

    setIsGenerating(true)
    setReadingText('')
    incrementAiReadingCount()

    // スプレッド別の特別プロンプト生成
    let extraHint = ''
    if (isSmallTable && drawnCards.length === 9) {
      const c = drawnCards as unknown as Array<Record<string, string>>
      extraHint = isZhTW
        ? `小桌牌陣的解讀方式：
- 中心（${c[4]?.nameZhTW ?? drawnCards[4]?.nameJa ?? ''}）為主要主題
- 橫列（${c[3]?.nameZhTW ?? ''}→${c[4]?.nameZhTW ?? ''}→${c[5]?.nameZhTW ?? ''}）：目前的流勢
- 縦列（${c[1]?.nameZhTW ?? ''}→${c[4]?.nameZhTW ?? ''}→${c[7]?.nameZhTW ?? ''}）：時間的流勢
- 請也意識對角線，進行綜合解讀`
        : `小テーブルの読み方:
- 中心（${drawnCards[4]?.nameJa ?? ''}）がメインテーマ
- 横ライン（${drawnCards[3]?.nameJa ?? ''}→${drawnCards[4]?.nameJa ?? ''}→${drawnCards[5]?.nameJa ?? ''}）: 現在の流れ
- 縦ライン（${drawnCards[1]?.nameJa ?? ''}→${drawnCards[4]?.nameJa ?? ''}→${drawnCards[7]?.nameJa ?? ''}）: 時間の流れ
- 対角線も意識して総合的に読んでください`
    } else if (isGrandTableau && drawnCards.length === 36) {
      const c = drawnCards as unknown as Array<Record<string, string>>
      extraHint = isZhTW
        ? `這是大牌陣（36張展開）的解讀。
請按照 4×9 的配置，依以下區域分別解讀：

「過去區」左列：${c.slice(0, 9).map(x => x.nameZhTW ?? x.nameJa).join('・')}
「現在區」中間列：${c.slice(9, 27).map(x => x.nameZhTW ?? x.nameJa).join('・')}
「未來區」右列：${c.slice(27, 36).map(x => x.nameZhTW ?? x.nameJa).join('・')}

請也注意人物牌（男性・女性）的位置。

請必须按以下順序寫完整：

## 整體流向（200字）
目前整體狀況的訊息

## 區域別解讀
「過去」「現在」「未來」三區域各100字

## 主題別
工作・愛情・健康・金錢各50字簡述

## 給今天的你（100字）
結語訊息

※ 請必须完成每個章節再進行下一個。`
        : `グランタブロー（36枚展開）のリーディングです。
4×9の配置で、以下のエリア別に読んでください:

【過去エリア】左列: ${drawnCards.slice(0, 9).map(x => x.nameJa).join('・')}
【現在エリア】中央列: ${drawnCards.slice(9, 27).map(x => x.nameJa).join('・')}
【未来エリア】右列: ${drawnCards.slice(27, 36).map(x => x.nameJa).join('・')}

人物カード（男性・女性）の位置も意識してください。

必ず以下の順序で、最後まで書き切ってください：

## 全体の流れ（200字）
今の状況全体のメッセージ

## エリア別リーディング
【過去】【現在】【未来】の3エリアを各100字で

## テーマ別
仕事・恋愛・健康・お金を各50字で簡潔に

## 今日のあなたへ（100字）
締めくくりのメッセージ

※ 各セクションを必ず完結させてから次に進んでください`
    }

    try {
      const positions = POSITIONS[selectedSpread.id] ?? []
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: drawnCards.map(c => ({ name: isZhTW ? (c as unknown as Record<string, string>).nameZhTW ?? c.nameJa : c.nameJa, keyword: isZhTW ? (c as unknown as Record<string, string>).keywordZhTW ?? c.keyword : c.keyword })),
          positions,
          spreadName: selectedSpread.name,
          moonPhase: moon.phaseLabel,
          moonSign: moon.moonSign,
          extraHint,
          locale,
        }),
      })
      if (!res.ok || !res.body) throw new Error('stream failed')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setReadingText(p => p + dec.decode(value, { stream: true }))
      }
    } catch {
      setReadingText('リーディングの生成に失敗しました。しばらくしてからお試しください。')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedSpread, moon, drawnCards, isSmallTable, isGrandTableau, isZhTW, locale, POSITIONS])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      {upsellMsg && (
        <UpsellModal message={upsellMsg} onClose={() => setUpsellMsg(null)} />
      )}
      <Navbar />
      {/* ヘッダー */}
      <div style={{ borderBottom: '1px solid rgba(196,160,96,0.1)', padding: '24px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {selectedSpread && (
            <button
              onClick={() => setSelectedSpread(null)}
              style={{
                fontFamily: C.sans, fontSize: '12px', color: C.goldMt,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, marginBottom: '12px', letterSpacing: '0.04em',
              }}
            >
              {t('reading.backToSpreads')}
            </button>
          )}
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '6px' }}>READING</div>
          <h1 style={{ fontFamily: C.serif, fontSize: '26px', fontWeight: 300, color: C.goldLt, marginBottom: '6px' }}>
            {selectedSpread ? selectedSpread.name : 'リーディング'}
          </h1>
          {moon && (
            <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt }}>
              {moon.phaseEmoji} {moon.phaseLabel} · {moon.moonSign}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,48px)' }}>

        {/* ── スプレッド選択グリッド ── */}
        {!selectedSpread && (
          <>
            <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, marginBottom: '28px' }}>
              {t('reading.selectPrompt')}
            </p>
            {/* Tailwindのgridクラスは使わずinline styleで確実に効かせる */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}>
              {SPREADS.map(sp => (
                <div
                  key={sp.id}
                  onClick={() => {
                    console.log('[SpreadCard] clicked:', sp.id)
                    selectSpread(sp)
                  }}
                  onMouseEnter={() => setHoveredId(sp.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: C.bgCard,
                    border: `1px solid ${hoveredId === sp.id ? C.gold : C.bdr}`,
                    borderRadius: '14px', padding: '20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, transform 0.2s',
                    transform: hoveredId === sp.id ? 'translateY(-2px)' : 'none',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    fontFamily: C.sans, fontSize: '8px', letterSpacing: '0.1em',
                    padding: '2px 7px', borderRadius: '4px',
                    color: sp.free ? '#6a9060' : C.goldMt,
                    background: sp.free ? 'rgba(100,140,90,0.1)' : 'rgba(196,160,96,0.07)',
                    border: `1px solid ${sp.free ? 'rgba(100,140,90,0.3)' : C.bdr}`,
                    pointerEvents: 'none',
                  }}>
                    {sp.free ? t('reading.free') : t('reading.premium')}
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <SpreadIcon count={sp.cards} />
                  </div>
                  <div style={{
                    fontFamily: C.serif, fontSize: '16px',
                    color: hoveredId === sp.id ? C.gold : C.goldLt,
                    transition: 'color 0.2s', marginTop: '10px',
                    pointerEvents: 'none',
                  }}>
                    {sp.name}
                  </div>
                  <div style={{
                    fontFamily: C.sans, fontSize: '11px', color: C.goldMt,
                    marginTop: '4px', lineHeight: 1.6,
                    pointerEvents: 'none',
                  }}>
                    {sp.desc}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── リーディングセッション ── */}
        {selectedSpread && (
          <>
            {/* ━━ 準備フェーズ ━━ */}
            {readyPhase && (
              <div style={{
                textAlign: 'center',
                padding: '56px 24px',
                maxWidth: '480px',
                margin: '0 auto',
                animation: 'fadeIn 0.5s ease',
              }}>
                {/* 月アニメーション */}
                <div style={{
                  fontSize: '52px',
                  marginBottom: '28px',
                  display: 'inline-block',
                  animation: 'moonPulse 3s ease-in-out infinite',
                }}>
                  {moon?.phaseEmoji ?? '\u{1F319}'}
                </div>

                {/* 儀式テキスト */}
                <h2 style={{
                  fontFamily: C.serif,
                  fontSize: '22px',
                  color: C.gold,
                  marginBottom: '16px',
                  lineHeight: 1.6,
                  fontWeight: 300,
                  letterSpacing: '0.06em',
                }}>
                  {isZhTW ? '\u8acb\u975c\u4e0b\u5fc3\u4f86' : '\u5fc3\u3092\u9759\u3081\u3066\u304f\u3060\u3055\u3044'}
                </h2>

                <p style={{
                  fontFamily: C.sans,
                  fontSize: '14px',
                  color: C.goldMt,
                  lineHeight: 2,
                  marginBottom: '36px',
                  whiteSpace: 'pre-line',
                }}>
                  {isZhTW
                    ? '\u8acb\u5728\u5fc3\u4e2d\u9ed8\u60f3\u4f60\u60f3\u5360\u535c\u7684\u554f\u984c\u3002\n\u6df1\u547c\u5438\u4e09\u6b21\uff0c\u611f\u53d7\u6708\u4eae\u7684\u80fd\u91cf\u6d41\u5165\u4f60\u7684\u5167\u5fc3\u3002\n\u6e96\u5099\u597d\u5f8c\uff0c\u8acb\u7ffb\u958b\u724c\u5361\u3002'
                    : '\u5fc3\u306e\u4e2d\u3067\u3001\u5360\u3044\u305f\u3044\u3053\u3068\u3092\u3086\u3063\u304f\u308a\u601d\u3044\u6d6e\u304b\u3079\u3066\u304f\u3060\u3055\u3044\u3002\n\u6df1\u547c\u5438\u30923\u56de\u3057\u3066\u3001\u6708\u306e\u30a8\u30cd\u30eb\u30ae\u30fc\u3092\u611f\u3058\u3066\u304f\u3060\u3055\u3044\u3002\n\u6e96\u5099\u304c\u3067\u304d\u305f\u3089\u3001\u30ab\u30fc\u30c9\u3092\u3081\u304f\u308a\u307e\u3057\u3087\u3046\u3002'
                  }
                </p>

                {/* スプレッド名 */}
                <div style={{
                  fontFamily: C.sans,
                  fontSize: '10px',
                  color: C.goldDim,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  {selectedSpread.nameEn}
                </div>
                <div style={{
                  fontFamily: C.serif,
                  fontSize: '16px',
                  color: '#c8b88a',
                  marginBottom: '40px',
                  letterSpacing: '0.05em',
                }}>
                  {selectedSpread.name}
                </div>

                {/* 準備完了ボタン */}
                <button
                  onClick={() => setReadyPhase(false)}
                  style={{
                    padding: '14px 44px',
                    background: 'transparent',
                    border: '0.5px solid rgba(196,160,96,0.45)',
                    borderRadius: '99px',
                    color: C.gold,
                    fontSize: '14px',
                    fontFamily: C.serif,
                    cursor: 'pointer',
                    letterSpacing: '0.12em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(196,160,96,0.1)'
                    e.currentTarget.style.borderColor = C.gold
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(196,160,96,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(196,160,96,0.45)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {isZhTW ? '\u2736 \u958b\u59cb\u7ffb\u724c' : '\u2736 \u30ab\u30fc\u30c9\u3092\u3081\u304f\u308b'}
                </button>
              </div>
            )}

            {/* ━━ カードセッション（準備完了後）━━ */}
            {!readyPhase && (
            <>
            {/* グランタブロー: 指導バナー */}
            {isGrandTableau && !readingText && !isGenerating && (
              <div style={{
                fontFamily: C.sans, fontSize: '12px', color: C.goldMt,
                padding: '11px 16px', marginBottom: '28px',
                background: 'rgba(196,160,96,0.05)',
                border: '1px solid rgba(196,160,96,0.1)', borderRadius: '8px',
              }}>
                {t('reading.grandBanner')}
              </div>
            )}

            {/* 通常スプレッド: まだめくっていないときのヒント */}
            {!isGrandTableau && !allFlipped && (
              <div style={{
                fontFamily: C.sans, fontSize: '12px', color: C.goldMt,
                padding: '11px 16px', marginBottom: '28px',
                background: 'rgba(196,160,96,0.05)',
                border: '1px solid rgba(196,160,96,0.1)', borderRadius: '8px',
              }}>
                {flipped.filter(Boolean).length === 0
                  ? t('reading.tapHint')
                  : `${flipped.filter(Boolean).length} / ${selectedSpread.cards} ${t('reading.flippedCount') || '枚めくりました'}`}
              </div>
            )}

            {/* ── カード表示: スプレッド別レイアウト ── */}

            {/* 小テーブル: 3×3グリッド */}
            {isSmallTable && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px', marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px',
              }}>
                {drawnCards.map((card, i) => (
                  <div key={card.id} style={{ position: 'relative' }}>
                    <FlipCard
                      card={card}
                      position={(POSITIONS['small-table'] ?? [])[i] ?? `カード ${i + 1}`}
                      flipped={flipped[i] ?? false}
                      onClick={() => { if (!flipped[i]) flipCard(i) }}
                      imgError={imgErrors[i] ?? false}
                      onImgError={() => setImgErrors(prev => { const n = [...prev]; n[i] = true; return n })}
                    />
                    {/* 中心カードを強調 */}
                    {i === 4 && (
                      <div style={{
                        position: 'absolute', inset: '-3px', borderRadius: '12px',
                        border: `2px solid ${C.gold}`, pointerEvents: 'none',
                        boxShadow: `0 0 12px rgba(196,160,96,0.3)`,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* グランタブロー: 4×9グリッド (小さいカード) */}
            {isGrandTableau && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)',
                  gap: '6px', maxWidth: '100%',
                }}>
                  {drawnCards.map((card, i) => (
                    <div
                      key={card.id}
                      title={`${card.nameJa}\n${card.keyword}`}
                      style={{
                        position: 'relative', cursor: 'default',
                        borderRadius: '6px', overflow: 'hidden',
                        aspectRatio: '2/3',
                        background: C.bgCard,
                        border: `1px solid ${C.bdr}`,
                      }}
                    >
                      {(card as LenormandCard).file && (
                        <img
                          src={`/cards/${(card as LenormandCard).file}`}
                          alt={(card as LenormandCard).nameJa}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                      {!(card as LenormandCard).file && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: C.serif, fontSize: '8px', color: C.goldMt, textAlign: 'center', padding: '2px' }}>
                            {(card as LenormandCard).nameJa}
                          </span>
                        </div>
                      )}
                      {/* 番号 */}
                      <div style={{
                        position: 'absolute', bottom: '1px', right: '2px',
                        fontFamily: C.sans, fontSize: '7px', color: 'rgba(196,160,96,0.6)',
                      }}>{i + 1}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginTop: '8px', textAlign: 'center' }}>
                  左3列: 過去 &nbsp;|&nbsp; 中大3列: 現在 &nbsp;|&nbsp; 右3列: 未来
                </div>
              </div>
            )}

            {/* 通常スプレッド: flexラップ */}
            {!isSmallTable && !isGrandTableau && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
                {drawnCards.map((card, i) => (
                  <FlipCard
                    key={card.id}
                    card={card}
                    position={(POSITIONS[selectedSpread.id] ?? [])[i] ?? `カード ${i + 1}`}
                    flipped={flipped[i] ?? false}
                    onClick={() => { if (!flipped[i]) flipCard(i) }}
                    imgError={imgErrors[i] ?? false}
                    onImgError={() => setImgErrors(prev => { const n = [...prev]; n[i] = true; return n })}
                  />
                ))}
              </div>
            )}

            {/* 全枚めくったら AI ボタン */}
            {allFlipped && !readingText && !isGenerating && (
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, marginBottom: '16px' }}>
                  {isGrandTableau ? t('reading.grandReady') : t('reading.allFlipped')}
                </p>
                <button
                  onClick={generateReading}
                  style={{
                    fontFamily: C.sans, padding: '14px 40px',
                    background: C.gold, border: 'none',
                    borderRadius: '10px', color: C.bg,
                    fontSize: '14px', fontWeight: 700,
                    letterSpacing: '0.08em', cursor: 'pointer',
                  }}
                >
                  {isGrandTableau ? t('reading.generateGrand') : t('reading.generateReading')}
                </button>
              </div>
            )}

            {/* AI リーディング表示 */}
            {(isGenerating || readingText) && (
              <div style={{
                background: C.bgCard,
                border: `1px solid ${C.bdr}`,
                borderRadius: '16px', padding: '28px 32px',
              }}>
                <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.15em', marginBottom: '18px' }}>
                  {moon?.phaseEmoji} {moon?.phaseLabel} · {moon?.moonSign} {t('reading.moonReading')}
                </div>
                {/* 生成中: ローディングアニメーション */}
                {isGenerating && (
                  <div style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                  }}>
                    {/* 月のspinアニメ */}
                    <div style={{
                      fontSize: '36px',
                      marginBottom: '16px',
                      display: 'inline-block',
                      animation: 'spin 4s linear infinite',
                    }}>🌙</div>

                    {/* ローディングメッセージ */}
                    <div style={{
                      fontSize: '14px',
                      color: '#c4a060',
                      fontFamily: 'serif',
                      letterSpacing: '0.05em',
                      lineHeight: 1.8,
                      minHeight: '28px',
                      animation: 'fadeMsg 3s ease-in-out infinite',
                    }}>
                      {READING_LOADING_MESSAGES[loadingMsgIndex]}
                    </div>

                    {/* ドットアニメ */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '16px',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#c4a060',
                          opacity: 0.4,
                          animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 完了: Markdown レンダリング */}
                {readingText && (
                  <div style={{ fontFamily: C.serif }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p style={{ marginBottom: '1rem', lineHeight: '1.9', color: '#c8b88a', fontFamily: C.serif, fontSize: '15px', letterSpacing: '0.04em' }}>
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: '#c4a060', fontWeight: 600 }}>{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em style={{ color: '#a08858', fontStyle: 'italic' }}>{children}</em>
                        ),
                        h1: ({ children }) => (
                          <h2 style={{ color: '#c4a060', fontSize: '16px', marginBottom: '12px', marginTop: '20px', fontFamily: C.serif, letterSpacing: '0.06em' }}>{children}</h2>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ color: '#c4a060', fontSize: '15px', marginBottom: '10px', marginTop: '18px', fontFamily: C.serif, letterSpacing: '0.06em' }}>{children}</h2>
                        ),
                        hr: () => (
                          <hr style={{ borderColor: 'rgba(196,160,96,0.2)', margin: '16px 0', borderWidth: '1px 0 0 0' }} />
                        ),
                        ul: ({ children }) => (
                          <ul style={{ paddingLeft: '1.4em', marginBottom: '1rem', color: '#c8b88a', fontSize: '14px', lineHeight: 1.9 }}>{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: '4px' }}>{children}</li>
                        ),
                      }}
                    >
                      {readingText}
                    </ReactMarkdown>
                  </div>
                )}
                {!isGenerating && readingText && (
                  <div style={{ marginTop: '24px' }}>
                    {/* free プランかつ daily/three 利用時のアップセルバナー */}
                    {getSubscription().plan === 'free' &&
                      (selectedSpread?.id === 'daily' || selectedSpread?.id === 'three') && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '14px 16px',
                        background: 'rgba(196,160,96,0.06)',
                        border: '0.5px solid rgba(196,160,96,0.2)',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '13px', color: '#c4a060', marginBottom: '6px' }}>
                          ✦ もっと深く読みたいですか？
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a7a60', marginBottom: '12px', lineHeight: 1.7 }}>
                          満月スプレッド・小テーブル・グランタブローなど<br />
                          6種のスプレッドとAIリーディング月50回がご利用いただけます
                        </div>
                        <a
                          href="/premium"
                          style={{
                            fontSize: '12px', padding: '8px 20px',
                            background: '#2a1e0a', border: '0.5px solid #c4a060',
                            borderRadius: '99px', color: '#c4a060', textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          プランを見る →
                        </a>
                      </div>
                    )}
                    <div style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => { setReadingText(''); setFlipped(Array(selectedSpread.cards).fill(false)) }}
                        style={{
                          fontFamily: C.sans, fontSize: '11px', color: C.goldMt,
                          background: 'none', border: `1px solid ${C.bdr}`,
                          borderRadius: '6px', padding: '6px 16px', cursor: 'pointer',
                        }}
                      >
                        {t('reading.regenerate')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes moonPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ═══ Suspense wrapper (useSearchParams requires Suspense boundary) ═══
export default function ReadingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#c4a060', fontFamily: 'Georgia, serif', fontSize: '14px' }}>読み込み中...</span>
      </div>
    }>
      <ReadingPageInner />
    </Suspense>
  )
}
