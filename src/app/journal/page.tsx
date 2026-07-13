'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useLocale } from '@/lib/i18n'
import { calculateMoonPhase, daysUntilNewMoon, daysUntilFullMoon } from '@/lib/moon-phase'
import type { MoonPhaseData } from '@/lib/moon-phase'

const C = {
  bg: '#1a1508', bgCard: '#1e1a08',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

interface JournalEntry {
  id: string
  type: 'newmoon' | 'fullmoon'
  date: string
  moonPhase: string
  moonSign: string
  content: Record<string, string>
  tags?: string[]
  createdAt: number
}

const STORAGE_KEY = 'mooncycle-journal'

function loadEntries(): JournalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as JournalEntry[]
  } catch {
    return []
  }
}

function saveEntry(entry: JournalEntry) {
  const entries = loadEntries()
  entries.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

const textareaStyle: React.CSSProperties = {
  width: '100%', minHeight: '90px',
  background: 'rgba(196,160,96,0.04)',
  border: '1px solid rgba(196,160,96,0.18)',
  borderRadius: '10px', padding: '12px 14px',
  color: '#e8dcc8', fontFamily: 'Georgia, serif',
  fontSize: '14px', lineHeight: 1.8,
  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
}

// ── 新月タブ ──────────────────────────────────────────────────────────────────
function NewMoonTab({ moon, daysToNew }: { moon: MoonPhaseData; daysToNew: number }) {
  const { t } = useLocale()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const questions = [t('journal.q1'), t('journal.q2'), t('journal.q3')]

  const handleSave = () => {
    saveEntry({
      id: Date.now().toString(), type: 'newmoon',
      date: new Date().toISOString().split('T')[0],
      moonPhase: moon.phaseLabel, moonSign: moon.moonSign,
      content: answers, createdAt: Date.now(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      {/* ヒーローカード */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.bdr}`,
        borderRadius: '16px', padding: '24px', marginBottom: '28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌑</div>
        <div style={{ fontFamily: C.serif, fontSize: '18px', color: C.gold, marginBottom: '6px' }}>{t('journal.new_wish')}</div>
        <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt }}>
          {t('journal.days_to_new')} <strong style={{ color: C.gold }}>{daysToNew}</strong> {t('journal.days_unit')}
        </div>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, marginTop: '6px' }}>
          {moon.moonSign} · {moon.theme}
        </div>
      </div>

      {/* 3つの質問 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
        {questions.map((q, i) => (
          <div key={i}>
            <label style={{
              display: 'block', fontFamily: C.serif, fontSize: '14px',
              color: C.goldLt, marginBottom: '8px',
            }}>
              {q}
            </label>
            <div style={{ fontSize: '11px', color: '#6a5a40', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🔒</span>
              <span>{t('journal.local_only')}</span>
            </div>
            <textarea
              style={textareaStyle}
              placeholder={t('journal.placeholder_new')}
              value={answers[q] ?? ''}
              onChange={e => setAnswers(p => ({ ...p, [q]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '14px',
          background: saved ? 'rgba(100,140,90,0.3)' : C.gold,
          border: 'none', borderRadius: '10px',
          color: saved ? '#8aaa80' : C.bg,
          fontFamily: C.sans, fontSize: '14px', fontWeight: 700,
          letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.3s',
        }}
      >
        {saved ? t('journal.saved_new') : t('journal.save_new')}
      </button>
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#4a3a20', marginTop: '8px' }}>
        {t('journal.local_only_sub')}
      </div>
    </div>
  )
}

// ── 満月タブ ──────────────────────────────────────────────────────────────────
function FullMoonTab({ moon, daysToFull }: { moon: MoonPhaseData; daysToFull: number }) {
  const { t } = useLocale()
  const [steps, setSteps] = useState([false, false, false])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [saved, setSaved] = useState(false)

  const ritualSteps = [t('journal.ritual_step1'), t('journal.ritual_step2'), t('journal.ritual_step3')]
  const releaseTags = [
    t('journal.tag_fear'), t('journal.tag_attachment'), t('journal.tag_anger'),
    t('journal.tag_regret'), t('journal.tag_comparison'), t('journal.tag_self_crit'),
    t('journal.tag_tired'), t('journal.tag_anxiety'), t('journal.tag_jealousy'),
    t('journal.tag_old_pattern'),
  ]

  const toggleTag = (tag: string) =>
    setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])

  const handleSave = () => {
    saveEntry({
      id: Date.now().toString(), type: 'fullmoon',
      date: new Date().toISOString().split('T')[0],
      moonPhase: moon.phaseLabel, moonSign: moon.moonSign,
      content: { text: freeText }, tags: selectedTags,
      createdAt: Date.now(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      {/* ヒーローカード */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.bdr}`,
        borderRadius: '16px', padding: '24px', marginBottom: '28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌕</div>
        <div style={{ fontFamily: C.serif, fontSize: '18px', color: C.gold, marginBottom: '6px' }}>{t('journal.full_release')}</div>
        <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt }}>
          {t('journal.days_to_full')} <strong style={{ color: C.gold }}>{daysToFull}</strong> {t('journal.days_unit')}
        </div>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, marginTop: '6px' }}>
          {moon.moonSign} · {moon.theme}
        </div>
      </div>

      {/* リチュアルステップ */}
      <div style={{
        background: 'rgba(196,160,96,0.04)', border: `1px solid ${C.bdr}`,
        borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
      }}>
        <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.12em', marginBottom: '12px' }}>{t('journal.ritual_title')}</div>
        {ritualSteps.map((step, i) => (
          <div
            key={i}
            onClick={() => setSteps(p => { const n = [...p]; n[i] = !n[i]; return n })}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '8px 0', cursor: 'pointer',
              borderBottom: i < 2 ? `1px solid ${C.bdr}` : 'none',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              border: `1px solid ${steps[i] ? C.gold : C.bdr}`,
              background: steps[i] ? 'rgba(196,160,96,0.2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: C.gold, transition: 'all 0.2s',
            }}>
              {steps[i] ? '✓' : ''}
            </div>
            <span style={{
              fontFamily: C.sans, fontSize: '13px',
              color: steps[i] ? C.goldMt : C.goldLt,
              textDecoration: steps[i] ? 'line-through' : 'none',
              transition: 'color 0.2s',
            }}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* 手放しタグ */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, letterSpacing: '0.1em', marginBottom: '12px' }}>
          {t('journal.release_tags_title')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {releaseTags.map(tag => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontFamily: C.sans, fontSize: '12px',
                  padding: '6px 14px', borderRadius: '20px',
                  background: active ? 'rgba(196,160,96,0.18)' : 'transparent',
                  border: `1px solid ${active ? C.bdrSt : C.bdr}`,
                  color: active ? C.gold : C.goldMt,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* 自由記述 */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontFamily: C.serif, fontSize: '14px', color: C.goldLt, marginBottom: '8px' }}>
          {t('journal.release_label')}
        </label>
        <div style={{ fontSize: '11px', color: '#6a5a40', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🔒</span>
          <span>{t('journal.local_only')}</span>
        </div>
        <textarea
          style={{ ...textareaStyle, minHeight: '120px' }}
          placeholder={t('journal.placeholder_full')}
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
        />
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '14px',
          background: saved ? 'rgba(100,140,90,0.3)' : C.gold,
          border: 'none', borderRadius: '10px',
          color: saved ? '#8aaa80' : C.bg,
          fontFamily: C.sans, fontSize: '14px', fontWeight: 700,
          letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.3s',
        }}
      >
        {saved ? t('journal.saved_full') : t('journal.save_full')}
      </button>
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#4a3a20', marginTop: '8px' }}>
        {t('journal.local_only_sub')}
      </div>
    </div>
  )
}

// ── 過去の記録タブ ─────────────────────────────────────────────────────────────
function PastTab() {
  const { t } = useLocale()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'newmoon' | 'fullmoon'>('all')

  useEffect(() => { setEntries(loadEntries()) }, [])

  const filtered = entries.filter(e => filter === 'all' || e.type === filter)

  const filterOptions = [
    ['all', t('journal.filter_all')],
    ['newmoon', t('journal.filter_new')],
    ['fullmoon', t('journal.filter_full')],
  ] as const

  return (
    <div>
      {/* フィルター */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {filterOptions.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              fontFamily: C.sans, fontSize: '12px',
              padding: '6px 16px', borderRadius: '20px',
              background: filter === v ? 'rgba(196,160,96,0.18)' : 'transparent',
              border: `1px solid ${filter === v ? C.bdrSt : C.bdr}`,
              color: filter === v ? C.gold : C.goldMt,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          fontFamily: C.sans, fontSize: '13px', color: C.goldDim,
        }}>
          {t('journal.no_entries')}
          <br />
          <span style={{ fontSize: '11px', marginTop: '6px', display: 'block' }}>
            {t('journal.no_entries_sub')}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(entry => (
            <div
              key={entry.id}
              style={{
                background: C.bgCard, border: `1px solid ${C.bdr}`,
                borderRadius: '12px', padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>{entry.type === 'newmoon' ? '🌑' : '🌕'}</span>
                <span style={{ fontFamily: C.serif, fontSize: '14px', color: C.gold }}>
                  {entry.type === 'newmoon' ? t('journal.new_wish') : t('journal.full_release')}
                </span>
                <span style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginLeft: 'auto' }}>
                  {entry.date}
                </span>
              </div>
              <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginBottom: '8px' }}>
                {entry.moonPhase} · {entry.moonSign}
              </div>
              <p style={{ fontFamily: C.serif, fontSize: '13px', color: C.goldMt, lineHeight: 1.7 }}>
                {Object.values(entry.content).filter(Boolean).join(' / ').slice(0, 90) + (
                  Object.values(entry.content).join('').length > 90 ? '...' : ''
                )}
              </p>
              {entry.tags && entry.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: C.sans, fontSize: '10px', color: C.goldDim,
                      padding: '2px 8px', borderRadius: '10px', border: `1px solid ${C.bdr}`,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════
type TabId = 'newmoon' | 'fullmoon' | 'past'

export default function JournalPage() {
  const { t } = useLocale()
  const [tab, setTab]           = useState<TabId>('newmoon')
  const [moon, setMoon]         = useState<MoonPhaseData | null>(null)
  const [daysToNew, setDaysToNew]   = useState(0)
  const [daysToFull, setDaysToFull] = useState(0)

  useEffect(() => {
    setMoon(calculateMoonPhase())
    setDaysToNew(daysUntilNewMoon())
    setDaysToFull(daysUntilFullMoon())
  }, [])

  const TABS = [
    { id: 'newmoon'  as TabId, label: t('journal.tab_new') },
    { id: 'fullmoon' as TabId, label: t('journal.tab_full') },
    { id: 'past'     as TabId, label: t('journal.tab_history') },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />
      {/* ヘッダー */}
      <div style={{ borderBottom: '1px solid rgba(196,160,96,0.1)', padding: '24px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '6px' }}>JOURNAL</div>
          <h1 style={{ fontFamily: C.serif, fontSize: '26px', fontWeight: 300, color: C.goldLt }}>{t('journal.title')}</h1>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px)' }}>
        {/* プライバシーバナー */}
        <div style={{
          background: 'rgba(196,160,96,0.06)',
          border: '0.5px solid rgba(196,160,96,0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>🔒</span>
          <div>
            <div style={{ fontSize: '12px', color: '#c4a060', fontWeight: 600, marginBottom: '3px' }}>
              {t('journal.privacy_title')}
            </div>
            <div style={{ fontSize: '12px', color: '#8a7a60', lineHeight: '1.7' }}>
              {t('journal.privacy_desc')}
            </div>
          </div>
        </div>

        {/* タブ切り替え */}
        <div style={{
          display: 'flex', gap: '0',
          background: C.bgCard, borderRadius: '12px', padding: '3px',
          marginBottom: '32px', border: `1px solid ${C.bdr}`,
        }}>
          {TABS.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              style={{
                flex: 1, padding: '9px 4px',
                fontFamily: C.sans, fontSize: '11px',
                background: tab === tabItem.id ? 'rgba(196,160,96,0.18)' : 'transparent',
                border: `1px solid ${tab === tabItem.id ? C.bdrSt : 'transparent'}`,
                borderRadius: '9px',
                color: tab === tabItem.id ? C.gold : C.goldMt,
                cursor: 'pointer', transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        {moon ? (
          <>
            {tab === 'newmoon'  && <NewMoonTab  moon={moon} daysToNew={daysToNew}   />}
            {tab === 'fullmoon' && <FullMoonTab moon={moon} daysToFull={daysToFull} />}
            {tab === 'past'     && <PastTab />}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: C.goldMt, fontFamily: C.sans }}>{t('journal.loading')}</div>
        )}
      </div>
    </div>
  )
}
