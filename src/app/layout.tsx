import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

/* ── 動的メタデータ (Accept-Language で言語判定) ─────────────────────────── */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ?? ''

  const isZh =
    acceptLanguage.includes('zh-TW') ||
    acceptLanguage.includes('zh-HK') ||
    acceptLanguage.includes('zh-Hant') ||
    (acceptLanguage.includes('zh') && !acceptLanguage.includes('zh-CN'))

  const title = isZh
    ? 'MoonCycle | 月相 × 雷諾曼 × 八字'
    : 'MoonCycle | 月のリズムと命式が交差する場所'

  const description = isZh
    ? '月相 × 雷諾曼 × 八字。為你解讀今天最需要知道的事。'
    : '月相・ルノルマン・四柱推命の命式を掛け合わせた、あなただけのパーソナル占い。'

  return {
    title,
    description,
    keywords: isZh
      ? ['月相', '雷諾曼', '八字', '占卜', '月亮節律']
      : ['月相', '四柱推命', 'ルノルマン', '占い', '月のリズム', '命式'],
    authors: [{ name: 'MoonCycle' }],
    creator: 'MoonCycle',
    metadataBase: new URL('https://mooncycle-alpha.vercel.app'),

    /* ── Open Graph ──────────────────────────────────────────────────────── */
    openGraph: {
      type: 'website',
      locale: isZh ? 'zh_TW' : 'ja_JP',
      siteName: 'MoonCycle',
      title,
      description,
      url: 'https://mooncycle-alpha.vercel.app',
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
      title,
      description,
      images: ['/og-image.png'],
    },

    /* ── その他 ──────────────────────────────────────────────────────────── */
    robots: {
      index: true,
      follow: true,
    },
    themeColor: '#1a1508',
  }
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
        <Analytics />
      </body>
    </html>
  )
}
