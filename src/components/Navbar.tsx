'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useLocale } from '@/lib/i18n'

export default function Navbar() {
  const pathname    = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { locale, changeLocale, t }  = useLocale()

  const NAV_LINKS = [
    { href: '/reading',  label: t('nav.reading')  },
    { href: '/calendar', label: t('nav.calendar') },
    { href: '/journal',  label: t('nav.journal')  },
    { href: '/profile',  label: t('nav.profile')  },
  ]

  const langBtn = (
    <button
      onClick={() => changeLocale(locale === 'ja' ? 'zh-TW' : 'ja')}
      style={{
        fontSize: '12px',
        padding: '4px 12px',
        border: '0.5px solid rgba(196,160,96,0.3)',
        borderRadius: '99px',
        color: '#c4a060',
        background: 'transparent',
        cursor: 'pointer',
        marginRight: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        letterSpacing: '0.04em',
        transition: 'border-color 0.2s',
      }}
    >
      {locale === 'ja' ? '繁中' : '日本語'}
    </button>
  )

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#1a1508',
      borderBottom: '0.5px solid rgba(196,160,96,0.12)',
      backdropFilter: 'blur(8px)',
      padding: '0 clamp(16px, 4vw, 32px)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
    }}>
      {/* ロゴ */}
      <Link href="/" style={{
        fontSize: '18px', fontFamily: 'Georgia, serif',
        color: '#c4a060', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '8px',
        letterSpacing: '0.06em',
      }}>
        🌙 MoonCycle
      </Link>

      {/* PC ナビ */}
      <div className="navbar-pc" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {NAV_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              color: pathname === l.href ? '#c4a060' : '#8a7a60',
              textDecoration: 'none',
              borderBottom: pathname === l.href ? '1px solid #c4a060' : '1px solid transparent',
              paddingBottom: '2px',
              transition: 'color 0.2s, border-color 0.2s',
              letterSpacing: '0.04em',
            }}
          >
            {l.label}
          </Link>
        ))}

        {/* 言語切り替え */}
        {langBtn}

        <Link href="/premium" style={{ textDecoration: 'none' }}>
          <button style={{
            fontSize: '12px', padding: '6px 16px',
            border: '0.5px solid rgba(196,160,96,0.4)',
            borderRadius: '99px', color: '#c4a060',
            background: 'rgba(196,160,96,0.08)',
            cursor: 'pointer', letterSpacing: '0.08em',
            transition: 'background 0.2s',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            ✦ {t('nav.premium')}
          </button>
        </Link>
      </div>

      {/* SP ハンバーガー */}
      <button
        className="navbar-sp"
        onClick={() => setMobileOpen(o => !o)}
        aria-label={mobileOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={mobileOpen}
        style={{
          background: 'none', border: 'none',
          color: '#8a7a60', fontSize: '22px',
          cursor: 'pointer', padding: '4px',
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'block', width: '22px', height: '1.5px',
            background: '#c4a060',
            transition: 'transform 0.3s, opacity 0.3s',
            transform: mobileOpen
              ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
              : i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
              : 'scaleX(0)'
              : 'none',
            opacity: mobileOpen && i === 1 ? 0 : 1,
          }} />
        ))}
      </button>

      {/* SP メニュードロワー */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0,
          background: '#120f05',
          borderBottom: '0.5px solid rgba(196,160,96,0.12)',
          padding: '8px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: '0',
          zIndex: 49,
        }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '14px 0',
                fontSize: '15px', color: '#e8dcc8',
                textDecoration: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                borderBottom: '0.5px solid rgba(196,160,96,0.08)',
                letterSpacing: '0.04em',
              }}
            >
              {l.label}
            </Link>
          ))}
          {/* SP 言語切り替え */}
          <div style={{ marginTop: '16px' }}>
            {langBtn}
          </div>
          <Link href="/premium" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', marginTop: '8px' }}>
            <button style={{
              width: '100%', padding: '12px',
              background: 'rgba(196,160,96,0.08)',
              border: '0.5px solid rgba(196,160,96,0.4)',
              borderRadius: '8px', color: '#c4a060',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer',
            }}>
              ✦ {t('nav.premium')} プランを見る
            </button>
          </Link>
        </div>
      )}
    </nav>
  )
}
