'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { setSubscription } from '@/lib/subscription'
import type { PlanType } from '@/lib/subscription'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

export default function RestorePage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setMessage('')

    try {
      const res  = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = (await res.json()) as {
        found: boolean; plan?: string; validUntil?: string; message?: string
      }

      if (data.found && data.plan && data.validUntil) {
        setSubscription(data.plan as PlanType, new Date(data.validUntil))
        setStatus('success')
        setMessage(
          data.plan === 'premium'
            ? 'プレミアムプランを復元しました'
            : 'ライトプランを復元しました',
        )
        setTimeout(() => router.push('/'), 3000)
      } else {
        setStatus('error')
        setMessage(data.message ?? '復元に失敗しました')
      }
    } catch {
      setStatus('error')
      setMessage('通信エラーが発生しました。しばらくしてから再試行してください。')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />

      <div style={{
        maxWidth: '480px', margin: '0 auto',
        padding: 'clamp(48px,6vw,80px) clamp(16px,4vw,32px)',
      }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🌙</div>
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '12px' }}>
            RESTORE PURCHASE
          </div>
          <h1 style={{ fontFamily: C.serif, fontSize: '24px', fontWeight: 300, color: C.goldLt, marginBottom: '12px' }}>
            購入を復元する
          </h1>
          <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, lineHeight: 1.8 }}>
            購入時に使用したメールアドレスを入力してください。<br />
            Stripeの購入記録から自動でプランを復元します。
          </p>
        </div>

        {/* フォーム */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.bdr}`,
          borderRadius: '16px', padding: '32px 28px',
        }}>
          {status === 'success' ? (
            /* 成功状態 */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
              <div style={{ fontFamily: C.sans, fontSize: '14px', color: '#5a9a3a', fontWeight: 600, marginBottom: '8px' }}>
                {message}
              </div>
              <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.8, marginBottom: '20px' }}>
                プランの設定を保存しました。<br />まもなくホームへ移動します…
              </p>
              {/* プログレスバー */}
              <div style={{ height: '2px', background: 'rgba(90,154,58,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#5a9a3a', animation: 'progress 3s linear forwards', borderRadius: '1px' }} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleRestore} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block', fontFamily: C.sans, fontSize: '11px',
                  color: C.goldMt, letterSpacing: '0.1em', marginBottom: '8px',
                }}>
                  購入時のメールアドレス
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'rgba(196,160,96,0.04)',
                    border: `1px solid ${status === 'error' ? 'rgba(192,96,96,0.5)' : 'rgba(196,160,96,0.22)'}`,
                    borderRadius: '8px', color: C.goldLt,
                    fontFamily: C.sans, fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                    colorScheme: 'dark',
                    opacity: status === 'loading' ? 0.6 : 1,
                  }}
                />
              </div>

              {/* エラーメッセージ */}
              {status === 'error' && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(192,96,96,0.08)',
                  border: '1px solid rgba(192,96,96,0.3)',
                  fontFamily: C.sans, fontSize: '12px',
                  color: '#c06060', lineHeight: 1.7,
                }}>
                  ⚠️ {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                style={{
                  width: '100%', padding: '13px',
                  background: status === 'loading' ? 'rgba(196,160,96,0.4)' : C.gold,
                  border: 'none', borderRadius: '10px',
                  color: C.bg, fontFamily: C.sans,
                  fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: !email.trim() ? 0.5 : 1,
                }}
              >
                {status === 'loading' ? '検索中...' : '購入を復元する'}
              </button>

              <div style={{ textAlign: 'center', fontFamily: C.sans, fontSize: '11px', color: C.goldDim, lineHeight: 1.7 }}>
                ※ Stripe の購入記録を照合します<br />
                ※ 入力したメールアドレスはサーバーに保存されません
              </div>
            </form>
          )}
        </div>

        {/* 戻るリンク */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/premium" style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldDim, textDecoration: 'none' }}>
            ← プランページに戻る
          </a>
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}
