'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { setSubscription } from '@/lib/subscription'
import type { PlanType } from '@/lib/subscription'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60',
  bdr: 'rgba(196,160,96,0.18)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = (searchParams.get('plan') ?? 'lite') as PlanType

  useEffect(() => {
    // 1ヶ月後（年額でもサーバーから正確に取得するのが理想だが、ここは簡易実装）
    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + 1)
    setSubscription(plan, validUntil)

    const timer = setTimeout(() => {
      router.push('/')
    }, 4000)

    return () => clearTimeout(timer)
  }, [plan, router])

  const planLabel = plan === 'premium' ? 'プレミアムプラン' : 'ライトプラン'

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt,
      display: 'flex', flexDirection: 'column',
    }}>
      <Navbar />

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px,4vw,64px)',
      }}>
        <div style={{
          maxWidth: '480px', width: '100%', textAlign: 'center',
          background: C.bgCard, border: `1px solid ${C.bdr}`,
          borderRadius: '20px', padding: '48px 40px',
        }}>
          {/* 月アイコン */}
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🌕</div>

          <div style={{
            fontFamily: C.sans, fontSize: '10px', color: '#5a9a3a',
            letterSpacing: '0.18em', marginBottom: '16px',
          }}>
            PAYMENT SUCCESS
          </div>

          <h1 style={{
            fontFamily: C.serif, fontSize: '26px', fontWeight: 300,
            color: C.gold, marginBottom: '16px',
          }}>
            ありがとうございます！
          </h1>

          <p style={{
            fontFamily: C.sans, fontSize: '14px', color: C.goldMt,
            lineHeight: 1.8, marginBottom: '32px',
          }}>
            <strong style={{ color: C.goldLt }}>{planLabel}</strong>へのご登録が完了しました。
            <br />月のエネルギーとあなたの命式が、
            <br />より深く交差する体験をお楽しみください。
          </p>

          {/* ローディングバー */}
          <div style={{
            height: '2px', background: 'rgba(196,160,96,0.1)',
            borderRadius: '1px', overflow: 'hidden', marginBottom: '16px',
          }}>
            <div style={{
              height: '100%', background: C.gold,
              animation: 'progress 4s linear forwards',
              borderRadius: '1px',
            }} />
          </div>

          <div style={{ fontFamily: C.sans, fontSize: '11px', color: '#5a9a3a' }}>
            ✓ プラン設定を保存しました
          </div>
          <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldMt, marginTop: '6px' }}>
            まもなくホームへ移動します...
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#c4a060', fontFamily: 'Georgia, serif' }}>読み込み中...</span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
