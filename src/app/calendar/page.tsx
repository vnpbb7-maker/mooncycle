'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { calculateMoonPhase } from '@/lib/moon-phase'
import { useLocale } from '@/lib/i18n'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土']
const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']

const SEKKI_ZH: Record<string, string> = {
  '小寒': '小寒', '大寒': '大寒', '立春': '立春', '雨水': '雨水',
  '啓蟄': '驚蟄', '春分': '春分', '清明': '清明', '穀雨': '穀雨',
  '立夏': '立夏', '小満': '小滿', '芒種': '芒種', '夏至': '夏至',
  '小暑': '小暑', '大暑': '大暑', '立秋': '立秋', '処暑': '處暑',
  '白露': '白露', '秋分': '秋分', '寒露': '寒露', '霜降': '霜降',
  '立冬': '立冬', '小雪': '小雪', '大雪': '大雪', '冬至': '冬至',
}

const SOLAR_TERMS_2026: { date: string; name: string }[] = [
  { date: '2026-01-05', name: '小寒' }, { date: '2026-01-20', name: '大寒' },
  { date: '2026-02-04', name: '立春' }, { date: '2026-02-19', name: '雨水' },
  { date: '2026-03-06', name: '啓蟄' }, { date: '2026-03-20', name: '春分' },
  { date: '2026-04-05', name: '清明' }, { date: '2026-04-20', name: '穀雨' },
  { date: '2026-05-05', name: '立夏' }, { date: '2026-05-21', name: '小満' },
  { date: '2026-06-06', name: '芒種' }, { date: '2026-06-21', name: '夏至' },
  { date: '2026-07-07', name: '小暑' }, { date: '2026-07-23', name: '大暑' },
  { date: '2026-08-07', name: '立秋' }, { date: '2026-08-23', name: '処暑' },
  { date: '2026-09-08', name: '白露' }, { date: '2026-09-23', name: '秋分' },
  { date: '2026-10-08', name: '寒露' }, { date: '2026-10-23', name: '霜降' },
  { date: '2026-11-07', name: '立冬' }, { date: '2026-11-22', name: '小雪' },
  { date: '2026-12-07', name: '大雪' }, { date: '2026-12-22', name: '冬至' },
]

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type MoonEvent = 'newMoon' | 'fullMoon' | null

function getMoonEvent(date: Date): MoonEvent {
  const phase = calculateMoonPhase(date).phase
  const prev  = calculateMoonPhase(new Date(date.getTime() - 86400000)).phase
  if (phase === 'newMoon'  && prev !== 'newMoon')  return 'newMoon'
  if (phase === 'fullMoon' && prev !== 'fullMoon') return 'fullMoon'
  return null
}

interface CalDay {
  date: Date
  isCurrent: boolean
  moonEvent: MoonEvent
  solarTerm: string | null
}

function buildDays(year: number, month: number): CalDay[] {
  const solarMap = new Map(SOLAR_TERMS_2026.map(t => [t.date, t.name]))
  const first = new Date(year, month - 1, 1)
  const last  = new Date(year, month, 0)
  const startDow = first.getDay()
  const days: CalDay[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push({ date: d, isCurrent: false, moonEvent: getMoonEvent(d), solarTerm: solarMap.get(toKey(d)) ?? null })
  }
  for (let n = 1; n <= last.getDate(); n++) {
    const d = new Date(year, month - 1, n)
    days.push({ date: d, isCurrent: true, moonEvent: getMoonEvent(d), solarTerm: solarMap.get(toKey(d)) ?? null })
  }
  const rem = 42 - days.length
  for (let n = 1; n <= rem; n++) {
    const d = new Date(year, month, n)
    days.push({ date: d, isCurrent: false, moonEvent: getMoonEvent(d), solarTerm: solarMap.get(toKey(d)) ?? null })
  }
  return days
}

export default function CalendarPage() {
  const [today, setToday]       = useState<Date | null>(null)
  const [viewDate, setViewDate] = useState<Date | null>(null)
  const [selected, setSelected] = useState<CalDay | null>(null)
  const { locale } = useLocale()
  const isZh = locale === 'zh-TW'
  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    setToday(now)
    setViewDate(now)
  }, [])

  const year  = viewDate?.getFullYear()  ?? new Date().getFullYear()
  const month = (viewDate?.getMonth() ?? 0) + 1

  const days = useMemo(() => buildDays(year, month), [year, month])

  const monthEvents = useMemo(() =>
    days
      .filter(d => d.isCurrent && (d.moonEvent || d.solarTerm))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  , [days])

  const prevMonth = () => setViewDate(v => v ? new Date(v.getFullYear(), v.getMonth() - 1, 1) : v)
  const nextMonth = () => setViewDate(v => v ? new Date(v.getFullYear(), v.getMonth() + 1, 1) : v)

  const isToday    = (d: Date) => today    != null && toKey(d) === toKey(today)
  const isSelected = (d: Date) => selected != null && toKey(d) === toKey(selected.date)

  const WEEKDAYS = isZh ? WEEKDAYS_ZH : WEEKDAYS_JA

  const legend = [
    { color: C.gold,                 label: isZh ? '滿月' : '満月',  border: false },
    { color: 'rgba(196,160,96,0.4)', label: isZh ? '新月' : '新月',  border: true  },
    { color: '#c06060',              label: isZh ? '節氣' : '節入り', border: false },
  ]

  // 節気名を locale に応じて変換
  const sekkiLabel = (name: string | null) => {
    if (!name) return ''
    return isZh ? (SEKKI_ZH[name] ?? name) : name
  }

  // イベントリストの月相表示
  const moonLabel = (event: MoonEvent) =>
    event === 'fullMoon'
      ? (isZh ? '滿月' : '満月')
      : (isZh ? '新月' : '新月')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />
      {/* ヘッダー */}
      <div style={{ borderBottom: '1px solid rgba(196,160,96,0.1)', padding: '24px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '6px' }}>CALENDAR</div>
          <h1 style={{ fontFamily: C.serif, fontSize: '26px', fontWeight: 300, color: C.goldLt }}>
            {isZh ? '月曆' : '月暦'}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px)' }}>
        {/* 月ナビゲーション */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={prevMonth}
            style={{ background: 'none', border: `1px solid ${C.bdr}`, borderRadius: '8px', color: C.goldMt, width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px' }}
          >‹</button>
          <div style={{ fontFamily: C.serif, fontSize: '18px', color: C.goldLt, letterSpacing: '0.06em' }}>
            {isZh ? `${year}年${month}月` : `${year}年 ${month}月`}
          </div>
          <button
            onClick={nextMonth}
            style={{ background: 'none', border: `1px solid ${C.bdr}`, borderRadius: '8px', color: C.goldMt, width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px' }}
          >›</button>
        </div>

        {/* 曜日ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{
              fontFamily: C.sans, fontSize: '10px', textAlign: 'center',
              color: i === 0 ? '#c06060' : i === 6 ? '#6080c0' : C.goldMt,
              padding: '4px 0', letterSpacing: '0.04em',
            }}>{w}</div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
          {days.map((day, idx) => {
            const dow  = idx % 7
            const isT  = isToday(day.date)
            const isSel = isSelected(day.date)
            return (
              <div
                key={idx}
                onClick={() => setSelected(day)}
                style={{
                  height: '48px', borderRadius: '10px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '3px', cursor: 'pointer',
                  background: isT
                    ? 'rgba(196,160,96,0.14)'
                    : isSel
                    ? 'rgba(196,160,96,0.2)'
                    : 'transparent',
                  border: isSel ? `1px solid ${C.gold}` : '1px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                  opacity: day.isCurrent ? 1 : 0.3,
                }}
              >
                <span style={{
                  fontFamily: C.sans, fontSize: '13px', lineHeight: 1,
                  color: isT ? C.gold : dow === 0 ? '#c07070' : dow === 6 ? '#7090c0' : C.goldLt,
                  fontWeight: isT ? 600 : 400,
                }}>
                  {day.date.getDate()}
                </span>
                {/* イベントドット */}
                <div style={{ display: 'flex', gap: '2px', height: '5px', alignItems: 'center' }}>
                  {day.moonEvent === 'fullMoon' && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.gold, display: 'block' }} />
                  )}
                  {day.moonEvent === 'newMoon' && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(196,160,96,0.4)', border: '1px solid rgba(196,160,96,0.5)', display: 'block' }} />
                  )}
                  {day.solarTerm && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#c06060', display: 'block' }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 凡例 */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'flex-end' }}>
          {legend.map(({ color, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: color, display: 'block',
                border: border ? '1px solid rgba(196,160,96,0.5)' : 'none',
              }} />
              <span style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldMt }}>{label}</span>
            </div>
          ))}
        </div>

        {/* 選択日の詳細パネル */}
        {selected && (selected.moonEvent || selected.solarTerm) && (
          <div style={{
            marginTop: '28px',
            background: C.bgCard, border: `1px solid ${C.bdrSt}`,
            borderRadius: '14px', padding: '20px 24px',
            animation: 'fadeIn 0.25s ease',
          }}>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldMt, marginBottom: '8px' }}>
              {selected.date.getFullYear()}{isZh ? '年' : '年'}{selected.date.getMonth() + 1}{isZh ? '月' : '月'}{selected.date.getDate()}{isZh ? '日' : '日'}
            </div>
            {selected.moonEvent && (
              <div style={{ marginBottom: selected.solarTerm ? '12px' : 0 }}>
                <span style={{ fontFamily: C.serif, fontSize: '18px', color: C.gold }}>
                  {selected.moonEvent === 'fullMoon'
                    ? (isZh ? '🌕 滿月' : '🌕 満月')
                    : (isZh ? '🌑 新月' : '🌑 新月')
                  }
                </span>
                <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, marginTop: '6px', lineHeight: 1.7 }}>
                  {selected.moonEvent === 'fullMoon'
                    ? (isZh
                        ? '迄今積累之物即將開花結果。帶著感謝，進行釋放的儀式吧。'
                        : 'これまで積み上げてきたものが実を結ぶ時期。感謝とともに手放しの儀式を。')
                    : (isZh
                        ? '新循環的開始。設定意圖，將願望的種子播撒於宇宙吧。'
                        : '新しいサイクルの始まり。意図を設定し、願いの種を宇宙に蒔きましょう。')
                  }
                </p>
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => router.push('/reading?spread=daily')}
                    style={{
                      fontFamily: C.sans, fontSize: '11px',
                      padding: '7px 18px',
                      background: 'rgba(196,160,96,0.1)',
                      border: `1px solid ${C.bdrSt}`,
                      borderRadius: '6px', color: C.gold, cursor: 'pointer',
                    }}
                  >
                    {isZh ? '查看當日占卜 →' : 'この日のリーディングへ →'}
                  </button>
                </div>
              </div>
            )}
            {selected.solarTerm && (
              <div style={{
                marginTop: selected.moonEvent ? '12px' : 0,
                paddingTop: selected.moonEvent ? '12px' : 0,
                borderTop: selected.moonEvent ? `1px solid ${C.bdr}` : 'none',
              }}>
                <span style={{ fontFamily: C.serif, fontSize: '16px', color: '#c06060' }}>
                  🌿 {sekkiLabel(selected.solarTerm)}
                </span>
                <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, marginTop: '6px', lineHeight: 1.7 }}>
                  {isZh
                    ? '太陽通過特定黃道經度的節氣。與自然節律同步的日子。'
                    : '太陽が特定の黄道経度を通過する節気。自然のリズムと同期する日です。'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* 今月のイベントリスト */}
        {monthEvents.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.15em', marginBottom: '14px' }}>
              {isZh ? '本月活動' : '今月のイベント'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {monthEvents.map((d, i) => (
                <div
                  key={i}
                  onClick={() => setSelected(d)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 16px',
                    background: C.bgCard, border: `1px solid ${C.bdr}`,
                    borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, minWidth: '40px' }}>
                    {isZh ? `${d.date.getDate()}日` : `${d.date.getDate()}日`}
                  </span>
                  <span style={{ fontSize: '16px' }}>
                    {d.moonEvent === 'fullMoon' ? '🌕' : d.moonEvent === 'newMoon' ? '🌑' : '🌿'}
                  </span>
                  <span style={{ fontFamily: C.serif, fontSize: '14px', color: C.goldLt }}>
                    {d.moonEvent
                      ? moonLabel(d.moonEvent)
                      : sekkiLabel(d.solarTerm)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
