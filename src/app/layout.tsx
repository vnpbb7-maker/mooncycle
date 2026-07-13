import type { Metadata } from 'next'
import './globals.css'

/* ── メタデータ ──────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'MoonCycle',
    template: '%s | MoonCycle',
  },
  description: '月のリズムとあなたの命式が交差する場所',
  keywords: ['月相', '四柱推命', 'ルノルマン', '占い', '月のリズム', '命式'],
  authors: [{ name: 'MoonCycle' }],
  creator: 'MoonCycle',

  /* ── Open Graph ─────────────────────────────────────────────────────── */
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'MoonCycle',
    title: 'MoonCycle — 月のリズムとあなたの命式が交差する場所',
    description: '月相・四柱推命・ルノルマンカードで、あなた固有の宇宙のリズムを読み解く。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MoonCycle',
      },
    ],
  },

  /* ── Twitter Card ────────────────────────────────────────────────────── */
  twitter: {
    card: 'summary_large_image',
    title: 'MoonCycle',
    description: '月のリズムとあなたの命式が交差する場所',
    images: ['/og-image.png'],
  },

  /* ── その他 ──────────────────────────────────────────────────────────── */
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#1a1508',
}

/* ── Root Layout ─────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
