'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { getSubscription } from '@/lib/subscription'
import type { SubscriptionState } from '@/lib/subscription'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08', bgDeep: '#120f05',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

const LITE_PRICE_ID           = process.env.NEXT_PUBLIC_STRIPE_LITE_PRICE_ID            ?? ''
const PREMIUM_PRICE_ID        = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID         ?? ''
const PREMIUM_YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID  ?? ''

// ── チェックアイコン ─────────────────────────────────────────────────────────
function Check({ ok }: { ok: boolean }) {
  return (
    <span style={{
      color: ok ? '#5a9a3a' : C.goldDim,
      fontSize: '13px', flexShrink: 0,
    }}>
      {ok ? '✓' : '✗'}
    </span>
  )
}

// ── 特典行 ───────────────────────────────────────────────────────────────────
function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 0' }}>
      <Check ok={ok} />
      <span style={{
        fontFamily: C.sans, fontSize: '13px',
        color: ok ? C.goldLt : C.goldDim, lineHeight: 1.5,
      }}>
        {children}
      </span>
    </div>
  )
}

// ── プランカード ─────────────────────────────────────────────────────────────
function PlanCard({
  badge, title, price, priceNote, features, cta, ctaDisabled, ctaAccent,
  highlight, onCtaClick, loading,
}: {
  badge?: string
  title: string
  price: string
  priceNote?: string
  features: { ok: boolean; text: string }[]
  cta: string
  ctaDisabled?: boolean
  ctaAccent?: boolean
  highlight?: boolean
  onCtaClick?: () => void
  loading?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      flex: 1, minWidth: '240px',
      background: highlight ? 'rgba(196,160,96,0.06)' : C.bgCard,
      border: `1px solid ${highlight ? C.bdrSt : C.bdr}`,
      borderRadius: '16px', padding: '28px 24px',
      position: 'relative',
      boxShadow: highlight ? '0 0 40px rgba(196,160,96,0.08)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '0',
    }}>
      {badge && (
        <div style={{
          position: 'absolute', top: '-12px', left: '50%',
          transform: 'translateX(-50%)',
          background: C.gold, color: C.bg,
          fontFamily: C.sans, fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', padding: '4px 14px', borderRadius: '20px',
          whiteSpace: 'nowrap',
        }}>
          {badge}
        </div>
      )}

      <div style={{ fontFamily: C.serif, fontSize: '18px', color: highlight ? C.gold : C.goldLt, marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontFamily: C.serif, fontSize: '32px', color: C.goldLt }}>{price}</span>
        {priceNote && (
          <span style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldDim, marginLeft: '6px' }}>
            {priceNote}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '24px' }}>
        {features.map((f, i) => (
          <Feature key={i} ok={f.ok}>{f.text}</Feature>
        ))}
      </div>

      <button
        onClick={onCtaClick}
        disabled={ctaDisabled || loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', padding: '13px',
          background: ctaDisabled
            ? 'rgba(196,160,96,0.05)'
            : ctaAccent
            ? (hovered ? '#d4b070' : C.gold)
            : (hovered ? 'rgba(196,160,96,0.12)' : 'rgba(196,160,96,0.06)'),
          border: `1px solid ${ctaDisabled ? C.bdr : ctaAccent ? 'transparent' : C.bdrSt}`,
          borderRadius: '10px',
          color: ctaDisabled ? C.goldDim : ctaAccent ? C.bg : C.gold,
          fontFamily: C.sans, fontSize: '13px', fontWeight: ctaAccent ? 700 : 400,
          letterSpacing: '0.06em', cursor: ctaDisabled ? 'default' : 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '処理中...' : cta}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════
export default function PremiumPage() {
  const [sub, setSub]         = useState<SubscriptionState | null>(null)
  const [yearly, setYearly]   = useState(false)
  const [loading, setLoading] = useState<string | null>(null) // 'lite' | 'premium'

  useEffect(() => {
    setSub(getSubscription())
  }, [])

  const handleCheckout = async (priceId: string, plan: 'lite' | 'premium') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      })
      const { url, error } = (await res.json()) as { url?: string; error?: string }
      if (error || !url) throw new Error(error ?? 'URL not returned')
      window.location.href = url
    } catch (err) {
      console.error(err)
      alert('決済ページへの遷移に失敗しました。しばらくしてから再試行してください。')
      setLoading(null)
    }
  }

  const planLabel = (plan: string) => {
    if (plan === 'lite')    return '🌙 ライトプラン利用中'
    if (plan === 'premium') return '✦ プレミアムプラン利用中'
    return null
  }

  const currentPlan = sub?.plan ?? 'free'
  const freeFeatures = [
    { ok: true,  text: '1枚引き・3枚引き' },
    { ok: true,  text: '今日の6枚デイリーカード' },
    { ok: true,  text: '月暦カレンダー' },
    { ok: true,  text: '月の日記（デバイス保存）' },
    { ok: false, text: 'AIリーディング' },
    { ok: false, text: '全スプレッド（6種）' },
  ]
  const liteFeatures = [
    { ok: true, text: '無料プランの全機能' },
    { ok: true, text: '全6種スプレッド' },
    { ok: true, text: 'AIリーディング 月50回' },
    { ok: true, text: '命式×月パーソナライズ' },
    { ok: false, text: 'AIリーディング無制限' },
    { ok: false, text: '優先サポート' },
  ]
  const premiumFeatures = [
    { ok: true, text: 'ライトプランの全機能' },
    { ok: true, text: 'AIリーディング 無制限' },
    { ok: true, text: '優先サポート' },
    { ok: true, text: '新機能の先行アクセス' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />

      {/* ヘッダー */}
      <div style={{
        textAlign: 'center',
        padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,48px) 40px',
        borderBottom: `1px solid ${C.bdr}`,
      }}>
        <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '16px' }}>
          PRICING
        </div>
        <h1 style={{ fontFamily: C.serif, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 300, color: C.gold, marginBottom: '16px' }}>
          MoonCycleを、もっと深く。
        </h1>
        <p style={{ fontFamily: C.sans, fontSize: '14px', color: C.goldMt, maxWidth: '480px', margin: '0 auto', lineHeight: 1.8 }}>
          月のリズムとあなただけの命式が交差する、
          <br />本格的な占いの体験へ
        </p>

        {/* 現在のプラン状態 */}
        {sub && planLabel(currentPlan) && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            marginTop: '24px', padding: '8px 20px',
            background: 'rgba(196,160,96,0.08)',
            border: `1px solid ${C.bdrSt}`, borderRadius: '20px',
            fontFamily: C.sans, fontSize: '12px', color: C.gold,
          }}>
            {planLabel(currentPlan)}
            {currentPlan === 'lite' && (
              <span style={{ color: C.goldMt }}>
                · 今月あと {Math.max(0, 50 - (sub.aiReadingCount ?? 0))} 回
              </span>
            )}
            {currentPlan === 'premium' && sub.validUntil && (
              <span style={{ color: C.goldMt }}>
                · {new Date(sub.validUntil).toLocaleDateString('ja-JP')}まで
              </span>
            )}
          </div>
        )}

        {/* 年額/月額トグル */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginTop: '32px',
        }}>
          <span style={{ fontFamily: C.sans, fontSize: '13px', color: yearly ? C.goldDim : C.goldLt }}>月額</span>
          <div
            onClick={() => setYearly(y => !y)}
            style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: yearly ? 'rgba(196,160,96,0.3)' : 'rgba(196,160,96,0.1)',
              border: `1px solid ${C.bdrSt}`, cursor: 'pointer',
              position: 'relative', transition: 'background 0.3s',
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: yearly ? '23px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: C.gold, transition: 'left 0.3s',
            }} />
          </div>
          <span style={{ fontFamily: C.sans, fontSize: '13px', color: yearly ? C.goldLt : C.goldDim }}>
            年額
            <span style={{
              marginLeft: '6px', fontSize: '10px', padding: '2px 7px',
              background: 'rgba(90,154,58,0.15)', color: '#5a9a3a',
              border: '1px solid rgba(90,154,58,0.3)', borderRadius: '4px',
            }}>
              2ヶ月分お得
            </span>
          </span>
        </div>
      </div>

      {/* プランカード */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(32px,4vw,48px) clamp(16px,4vw,32px)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* 無料プラン */}
          <PlanCard
            title="無料プラン"
            price="¥0"
            features={freeFeatures}
            cta="現在のプラン"
            ctaDisabled={currentPlan === 'free'}
          />

          {/* ライトプラン */}
          <PlanCard
            badge="✦ おすすめ"
            title="ライトプラン"
            price="¥480"
            priceNote="/月"
            highlight
            features={liteFeatures}
            cta={currentPlan === 'lite' ? '✓ 利用中' : 'ライトプランを始める'}
            ctaAccent={currentPlan !== 'lite'}
            ctaDisabled={currentPlan === 'lite'}
            loading={loading === 'lite'}
            onCtaClick={() =>
              currentPlan !== 'lite' && handleCheckout(LITE_PRICE_ID, 'lite')
            }
          />

          {/* プレミアムプラン */}
          <PlanCard
            title="プレミアムプラン"
            price={yearly ? '¥7,800' : '¥980'}
            priceNote={yearly ? '/年' : '/月'}
            features={premiumFeatures}
            cta={currentPlan === 'premium' ? '✓ 利用中' : 'プレミアムプランを始める'}
            ctaAccent={currentPlan !== 'premium'}
            ctaDisabled={currentPlan === 'premium'}
            loading={loading === 'premium'}
            onCtaClick={() =>
              currentPlan !== 'premium' &&
              handleCheckout(yearly ? PREMIUM_YEARLY_PRICE_ID : PREMIUM_PRICE_ID, 'premium')
            }
          />
        </div>

        {/* 購入復元リンク */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href="/premium/restore" style={{
            fontFamily: C.sans, fontSize: '13px', color: C.goldDim,
            textDecoration: 'none', letterSpacing: '0.02em',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = C.goldMt)}
            onMouseLeave={e => (e.currentTarget.style.color = C.goldDim)}
          >
            以前ご購入のお客様はこちら → 購入を復元する
          </a>
        </div>

        {/* 注意書き */}
        <div style={{
          marginTop: '40px', paddingTop: '32px',
          borderTop: `1px solid ${C.bdr}`,
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {[
            '※ お支払いはStripeにより安全に処理されます',
            '※ いつでもキャンセル可能です。解約後も期間終了まで利用できます',
            '※ AIリーディングはClaude AI（Anthropic）を使用しています',
            '※ 年額プランは一括払いです',
          ].map((t, i) => (
            <div key={i} style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, letterSpacing: '0.02em' }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
