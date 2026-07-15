'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import ReactMarkdown from 'react-markdown'
import { useLocale } from '@/lib/i18n'
import { calculateMoonPhase } from '@/lib/moon-phase'
import type { MoonPhaseData } from '@/lib/moon-phase'
import {
  calculateBazi,
  getBodyStrength,
  getYongShen,
  getYearFortune,
  getMoonPhaseMessages,
  ELEMENT_LABEL,
  ELEMENT_STYLE,
  DM_INFO_ZH,
  ZANG_GAN,
} from '@/lib/bazi'
import type { BaziResult } from '@/lib/bazi'
import { getSubscription } from '@/lib/subscription'
import { useRouter } from 'next/navigation'

// ── 定数 ─────────────────────────────────────────────────────────────────────
const C = {
  bg: '#1a1508', bgCard: '#1e1a08', bgDeep: '#120f05',
  gold: '#c4a060', goldLt: '#e8dcc8', goldMt: '#8a7a60', goldDim: '#6a5a40',
  bdr: 'rgba(196,160,96,0.18)', bdrSt: 'rgba(196,160,96,0.40)',
  serif: 'Georgia, serif', sans: '-apple-system, BlinkMacSystemFont, sans-serif',
} as const

const STORAGE_KEY = 'mooncycle_profile'

const MOON_PHASE_ORDER = [
  'newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
  'fullMoon', 'waningGibbous', 'lastQuarter', 'waningCrescent',
]
const MOON_PHASE_LABEL: Record<string, string> = {
  newMoon: '新月', waxingCrescent: '三日月', firstQuarter: '上弦の月',
  waxingGibbous: '十三夜', fullMoon: '満月', waningGibbous: '十六夜',
  lastQuarter: '下弦の月', waningCrescent: '晦日月',
}
const MOON_PHASE_LABEL_ZH: Record<string, string> = {
  newMoon: '新月', waxingCrescent: '眉月', firstQuarter: '上弦月',
  waxingGibbous: '盈凸月', fullMoon: '滿月', waningGibbous: '虧凸月',
  lastQuarter: '下弦月', waningCrescent: '殘月',
}
const MOON_PHASE_EMOJI: Record<string, string> = {
  newMoon: '🌑', waxingCrescent: '🌒', firstQuarter: '🌓',
  waxingGibbous: '🌔', fullMoon: '🌕', waningGibbous: '🌖',
  lastQuarter: '🌗', waningCrescent: '🌘',
}
// zh-TW: 身強弱説明
const BODY_DESC_ZH: Record<'strong' | 'weak', string> = {
  strong: '日主能量強盛。自立心與行動力旺盛。善用財星・官星的時期運勢大開。',
  weak:   '日主能量偏弱。接受他人支持方能發揮實力。印星・比劫流年運氣上升。',
}
// zh-TW: 用神説明
const YONG_DESC_ZH: Record<string, string> = {
  wood:  '強化木氣。成長・學習・新挑戰能開運。房間擺放綠色植物◎',
  fire:  '強化火氣。表達・行動・公開露面能開運。朝南的場所為吉',
  earth: '強化土氣。穩定・持續・打好基礎能開運。規律生活是關鍵',
  metal: '強化金氣。整理・決斷・提升品質能開運。白色・金色物品為吉',
  water: '強化水氣。直覺・順勢而為・學習能開運。水邊或泡澡為開運行動',
}
// zh-TW: 流年テーマ
const YEAR_FORTUNE_ZH: Record<string, { theme: string; advice: string; actions: string[] }> = {
  '比肩': { theme: '自立與競爭之年', advice: '相信自己的力量，挑戰獨立・創業・新企劃的時機。也需注意競爭對手。', actions: ['制定獨立・創業計畫', '磨練個人品牌', '競爭分析與差異化策略'] },
  '劫財': { theme: '合作與切磋之年', advice: '與夥伴合作能開運。但金錢借貸需特別謹慎。', actions: ['尋找可信賴的夥伴', '參與共同企劃', '重新檢視財務管理'] },
  '食神': { theme: '表達與豐盛之年', advice: '發揮才能、享受工作能開運。創作・料理・藝術為吉。', actions: ['開始創作活動', '享受飲食・美・藝術', '分享自己的強項'] },
  '傷官': { theme: '革新與才能綻放之年', advice: '突破現有框架之年。習得新技能或轉換跑道為吉。注意與權威衝突。', actions: ['習得新技能', '發表革新想法', '加強社群媒體發布'] },
  '偏財': { theme: '行動與意外收入之年', advice: '積極行動能引來財運。投資・副業・新事業為吉兆。', actions: ['考慮副業・投資', '挑戰新市場', '拓展人脈'] },
  '正財': { theme: '踏實與積財之年', advice: '一步一腳印地積累能獲得穩定收入。也要注重節約與儲蓄。', actions: ['重新檢視家計', '制定儲蓄計畫', '踏實累積實績'] },
  '偏官': { theme: '挑戰與壓力之年', advice: '挑戰高目標能開運。困難也是成長的養分。不可忽略健康管理。', actions: ['設定高遠目標', '強化體力・健康', '將逆境視為機會'] },
  '正官': { theme: '信任與晉升之年', advice: '認真投入的態度獲得賞識。職涯晉升・取得資格為吉。', actions: ['取得資格・提升技能', '與上司和組織建立信任', '秉持誠實的工作態度'] },
  '偏印': { theme: '學習與內省之年', advice: '心靈・學術・冥想充實的一年。不焦躁、從容積累知識的時期。', actions: ['養成讀書・學習習慣', '安排冥想・內省時間', '深化專業知識'] },
  '印綬': { theme: '保護與智慧之年', advice: '坦然接受他人支持的一年。學習・資格・母親般存在的緣分加深。', actions: ['尋找師傅・導師', '學習・取得資格', '練習感謝與接受'] },
}

interface ProfileData {
  name: string; birthDate: string; birthTime: string; gender: string
}

// ── 五行バッジ ────────────────────────────────────────────────────────────────
function ElemBadge({ elem, size = 'sm' }: { elem: string; size?: 'sm' | 'md' }) {
  const s = ELEMENT_STYLE[elem] ?? { bg: C.bgCard, text: C.goldMt }
  return (
    <span style={{
      display: 'inline-block', borderRadius: '4px',
      fontSize: size === 'md' ? '11px' : '9px',
      padding: size === 'md' ? '3px 9px' : '2px 7px',
      background: s.bg, color: s.text,
      border: `1px solid ${s.text}33`,
      fontFamily: C.sans, letterSpacing: '0.06em',
    }}>
      {ELEMENT_LABEL[elem] ?? elem}
    </span>
  )
}

// ── セクションヘッダー ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: C.sans, fontSize: '10px', color: C.goldDim,
      letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px',
    }}>
      {children}
    </div>
  )
}

// ── カードラッパー ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.bdr}`,
      borderRadius: '14px', padding: '24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── 通変星バッジ ───────────────────────────────────────────────────────────────
const TEN_GOD_COLOR: Record<string, string> = {
  '比肩':'#7a9a3a','劫財':'#5a8a2a',
  '食神':'#c06060','傷官':'#a04040',
  '偏財':'#b08040','正財':'#c09050',
  '偏官':'#4a7ac0','正官':'#3a6aad',
  '偏印':'#8a60c0','印綬':'#7a50b0',
  '不明': C.goldDim,
}
function TenGodBadge({ name }: { name: string }) {
  const color = TEN_GOD_COLOR[name] ?? C.goldDim
  return (
    <span style={{
      fontFamily: C.sans, fontSize: '8px', color,
      border: `0.5px solid ${color}66`, borderRadius: '3px',
      padding: '1px 4px', letterSpacing: '0.04em',
    }}>{name}</span>
  )
}

// ── 四柱カラム（本格版）────────────────────────────────────────────────────────
function PillarColumn({
  label, kan, shi, kanElem, shiElem, highlight,
  kanTenGod, shiTenGod, twelve, zangGan, zangGanTenGods, specialStars,
}: {
  label: string; kan: string; shi: string; kanElem: string; shiElem: string
  highlight?: boolean
  kanTenGod?: string; shiTenGod?: string
  twelve?: { name: string; power: number; stars: string }
  zangGan?: string[]; zangGanTenGods?: string[]
  specialStars?: string[]
}) {
  return (
    <div style={{
      flex: 1, minWidth: '70px', borderRadius: '12px', padding: '12px 8px',
      background: highlight ? 'rgba(196,160,96,0.08)' : C.bgCard,
      border: `1px solid ${highlight ? C.bdrSt : C.bdr}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      position: 'relative',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          fontFamily: C.sans, fontSize: '8px', color: C.gold, background: C.bgDeep,
          border: `1px solid ${C.bdrSt}`, padding: '2px 8px', borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}>日主</div>
      )}
      {/* 柱ラベル */}
      <div style={{ fontFamily: C.sans, fontSize: '8px', color: C.goldDim, letterSpacing: '0.12em' }}>{label}</div>

      {/* 天干 */}
      <div style={{ textAlign: 'center' }}>
        {kanTenGod && <TenGodBadge name={kanTenGod} />}
        <div style={{ fontFamily: C.serif, fontSize: '28px', color: highlight ? C.gold : C.goldLt, lineHeight: 1.1, marginTop: '2px' }}>{kan}</div>
        <ElemBadge elem={kanElem} />
      </div>

      <div style={{ width: '100%', height: '0.5px', background: C.bdr }} />

      {/* 地支 + 十二運 */}
      <div style={{ textAlign: 'center' }}>
        {shiTenGod && <TenGodBadge name={shiTenGod} />}
        <div style={{ fontFamily: C.serif, fontSize: '24px', color: C.goldMt, lineHeight: 1.1, marginTop: '2px' }}>{shi}</div>
        <ElemBadge elem={shiElem} />
        {twelve && (
          <div style={{ marginTop: '4px', fontFamily: C.sans, fontSize: '8px', color: C.goldDim }}>
            {twelve.name}
            <div style={{ fontSize: '9px', letterSpacing: '-1px' }}>{twelve.stars}</div>
          </div>
        )}
      </div>

      {/* 蔵干 */}
      {zangGan && zangGan.length > 0 && (
        <>
          <div style={{ width: '100%', height: '0.5px', background: C.bdr }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: C.sans, fontSize: '7px', color: C.goldDim, marginBottom: '2px' }}>蔵干</div>
            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {zangGan.map((g, i) => (
                <div key={g} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: C.serif, fontSize: '11px', color: C.goldMt }}>{g}</div>
                  {zangGanTenGods?.[i] && (
                    <div style={{ fontFamily: C.sans, fontSize: '7px', color: TEN_GOD_COLOR[zangGanTenGods[i]] ?? C.goldDim }}>
                      {zangGanTenGods[i]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 特殊星 */}
      {specialStars && specialStars.length > 0 && (
        <>
          <div style={{ width: '100%', height: '0.5px', background: C.bdr }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            {specialStars.map(s => (
              <div key={s} style={{
                fontFamily: C.sans, fontSize: '7px',
                color: s === '空亡' ? '#c06060' : s === '亡神' ? '#a04040' : '#c4a060',
                border: `0.5px solid currentColor`, borderRadius: '3px', padding: '1px 4px',
                whiteSpace: 'nowrap',
              }}>{s}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── 五行バーグラフ ─────────────────────────────────────────────────────────────
function WuxingBar({ wuxing }: { wuxing: Record<string, number> }) {
  const max = Math.max(...Object.values(wuxing), 1)
  const elems: [string, string][] = [['wood','木'],['fire','火'],['earth','土'],['metal','金'],['water','水']]
  return (
    <div style={{ display: 'flex', gap: '8px', height: '70px', alignItems: 'flex-end' }}>
      {elems.map(([key, label]) => {
        const s = ELEMENT_STYLE[key]
        const pct = ((wuxing[key] ?? 0) / max) * 100
        return (
          <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontFamily: C.sans, fontSize: '10px', color: s.text, fontWeight: 700 }}>{wuxing[key] ?? 0}</div>
            <div style={{ width: '100%', height: `${Math.max(pct, 10)}%`, background: s.bg, border: `1px solid ${s.text}55`, borderRadius: '3px 3px 0 0', transition: 'height 0.6s ease' }} />
            <div style={{ fontFamily: C.serif, fontSize: '12px', color: s.text }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── 相性スコアバー ─────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? C.gold : score >= 60 ? '#b08040' : C.goldDim
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', background: 'rgba(196,160,96,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontFamily: C.sans, fontSize: '11px', color, fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{score}</span>
    </div>
  )
}

// ── 月フェーズカード ─────────────────────────────────────────────────────────
function MoonPhaseCard({ phase, advice, isActive }: {
  phase: string; advice: { score: number; action: string; avoid: string }; isActive: boolean
}) {
  const { t, locale } = useLocale()
  const phaseLabels = locale === 'zh-TW' ? MOON_PHASE_LABEL_ZH : MOON_PHASE_LABEL
  const label = phaseLabels[phase] ?? phase
  const emoji = MOON_PHASE_EMOJI[phase] ?? '🌙'
  return (
    <div style={{
      background: isActive ? 'rgba(196,160,96,0.08)' : C.bgDeep,
      border: `1px solid ${isActive ? C.bdrSt : 'rgba(196,160,96,0.1)'}`,
      borderRadius: '12px', padding: '14px 16px',
      position: 'relative',
    }}>
      {isActive && (
        <div style={{
          position: 'absolute', top: '-9px', right: '12px',
          fontFamily: C.sans, fontSize: '8px', color: C.gold, background: C.bgDeep,
          border: `1px solid ${C.bdrSt}`, padding: '2px 8px', borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}>{t('profile.now_here')}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>{emoji}</span>
        <div style={{ fontFamily: C.serif, fontSize: '13px', color: isActive ? C.gold : C.goldLt }}>{label}</div>
      </div>
      <ScoreBar score={advice.score} />
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldMt, lineHeight: 1.6 }}>
          <span style={{ color: '#5a9a3a', marginRight: '4px' }}>✓</span>{advice.action}
        </div>
        <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, lineHeight: 1.6 }}>
          <span style={{ color: '#c06060', marginRight: '4px' }}>✗</span>{advice.avoid}
        </div>
      </div>
    </div>
  )
}

// ── 入力フォーム ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(196,160,96,0.04)',
  border: '1px solid rgba(196,160,96,0.22)',
  borderRadius: '8px', color: '#e8dcc8',
  fontFamily: 'Georgia, serif', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box', colorScheme: 'dark',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: C.sans,
  fontSize: '11px', color: C.goldMt,
  letterSpacing: '0.1em', marginBottom: '6px',
}

function ProfileForm({ onSave }: { onSave: (p: ProfileData) => void }) {
  const { t } = useLocale()
  const [form, setForm] = useState<ProfileData>({ name: '', birthDate: '', birthTime: '', gender: '女性' })
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setForm(JSON.parse(saved) as ProfileData)
    } catch { /* ignore */ }
  }, [])
  const today = new Date().toISOString().split('T')[0]
  const set = (k: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.birthDate) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    onSave(form)
  }
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div><label style={labelStyle}>{t('profile.name')}</label><input type="text" style={inputStyle} placeholder="山田 花子" value={form.name} onChange={set('name')} /></div>
      <div>
        <label style={labelStyle}>{t('profile.birthdate')} <span style={{ color: C.gold }}>*</span></label>
        <input type="date" style={inputStyle} max={today} required value={form.birthDate} onChange={set('birthDate')} />
      </div>
      <div>
        <label style={labelStyle}>{t('profile.birthtime')}</label>
        <input type="time" style={inputStyle} value={form.birthTime} onChange={set('birthTime')} />
        <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginTop: '5px' }}>{t('profile.birthtime_hint')}</div>
      </div>
      <div>
        <label style={labelStyle}>{t('profile.gender')}</label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.gender} onChange={set('gender')}>
          <option value="女性">{t('profile.female')}</option>
          <option value="男性">{t('profile.male')}</option>
          <option value="その他">{t('profile.other')}</option>
        </select>
      </div>
      <button type="submit" style={{
        width: '100%', padding: '14px', background: C.gold, border: 'none',
        borderRadius: '10px', color: C.bg, fontFamily: C.sans,
        fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
      }}>
        {t('profile.calculate')}
      </button>
    </form>
  )
}

// ── 命式結果（全セクション） ─────────────────────────────────────────────────
function BaziResultView({ profile, bazi, moon, onEdit }: {
  profile: ProfileData; bazi: BaziResult; moon: MoonPhaseData; onEdit: () => void
}) {
  const router = useRouter()
  const { t, locale } = useLocale()
  const isZhTW = locale === 'zh-TW'
  const [aiText, setAiText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

  const LOADING_MESSAGES = [
    t('profile.loading_msg1'),
    t('profile.loading_msg2'),
    t('profile.loading_msg3'),
    t('profile.loading_msg4'),
    t('profile.loading_msg5'),
  ]

  useEffect(() => {
    if (!isGenerating) return
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isGenerating])

  const dm     = ELEMENT_STYLE[bazi.dayMasterElement] ?? { bg: C.bgCard, text: C.gold }
  const body   = getBodyStrength(bazi)
  const yong   = getYongShen(bazi)
  const year   = getYearFortune(bazi)
  const moons  = getMoonPhaseMessages(bazi.dayMasterElement, locale)
  const isPremium = getSubscription().plan !== 'free'

  // zh-TW 差し替えテキスト（bazi.tsの新フィールドを優先使用）
  const bodyDesc = isZhTW ? (body.descZh ?? BODY_DESC_ZH[body.strength]) : body.desc
  const yongDesc = isZhTW ? (yong.yongShenDescZh ?? YONG_DESC_ZH[yong.yongShenElem] ?? yong.yongShenDesc) : yong.yongShenDesc
  const yongReason = isZhTW ? yong.reasonZh : yong.reason
  const yearZH = isZhTW ? (YEAR_FORTUNE_ZH[year.tenGodKan] ?? null) : null
  const yearTheme   = yearZH ? yearZH.theme   : year.theme
  const yearAdvice  = yearZH ? yearZH.advice  : year.advice
  const yearActions = yearZH ? yearZH.actions : year.actions

  // 蔵干通変星を事前計算（import済みのZANG_GANを使用）
  const zangTenGods = (zangGanArr: string[]) =>
    zangGanArr.map(g => {
      // bazi.tsのTIANGAN/TG_ELEMを参照するため、day masterから直接算出
      const idx = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].indexOf(g)
      const dmIdx = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].indexOf(bazi.dayKan)
      if (idx < 0 || dmIdx < 0) return '不明'
      const tgElem = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water'][idx]
      const dmElem = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water'][dmIdx]
      const dmYang = ['甲','丙','戊','庚','壬'].includes(bazi.dayKan)
      const gYang  = ['甲','丙','戊','庚','壬'].includes(g)
      const same   = dmYang === gYang
      if (bazi.dayKan === g) return '比肩'
      const SH = { wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood' } as Record<string,string>
      const KY = { wood:'metal',fire:'water',earth:'wood',metal:'fire',water:'earth'} as Record<string,string>
      const KE = { wood:'earth',earth:'water',water:'fire',fire:'metal',metal:'wood'} as Record<string,string>
      const BY = { wood:'water',fire:'wood',earth:'fire',metal:'earth',water:'metal'} as Record<string,string>
      if (dmElem === tgElem)         return same ? '比肩' : '劫財'
      if (SH[dmElem] === tgElem)     return same ? '食神' : '傷官'
      if (KE[dmElem] === tgElem)     return same ? '偏財' : '正財'
      if (KY[dmElem] === tgElem)     return same ? '偏官' : '正官'
      if (BY[dmElem] === tgElem)     return same ? '偏印' : '印綬'
      return '不明'
    })

  const pillars = [
    { label: t('profile.pillar_year'),  kan: bazi.yearKan,  shi: bazi.yearShi,  kanElem: bazi.yearKanElem,  shiElem: bazi.yearShiElem,
      kanTenGod: bazi.yearKanTenGod,   shiTenGod: bazi.yearShiTenGod,  twelve: bazi.yearTwelve,
      zangGan: bazi.yearZangGan,  zangGanTenGods: zangTenGods(bazi.yearZangGan),
      specialStars: bazi.specialStars.yearPillar ?? [] },
    { label: t('profile.pillar_month'), kan: bazi.monthKan, shi: bazi.monthShi, kanElem: bazi.monthKanElem, shiElem: bazi.monthShiElem,
      kanTenGod: bazi.monthKanTenGod,  shiTenGod: bazi.monthShiTenGod, twelve: bazi.monthTwelve,
      zangGan: bazi.monthZangGan, zangGanTenGods: zangTenGods(bazi.monthZangGan),
      specialStars: bazi.specialStars.monthPillar ?? [] },
    { label: t('profile.pillar_day'),   kan: bazi.dayKan,   shi: bazi.dayShi,   kanElem: bazi.dayKanElem,   shiElem: bazi.dayShiElem, highlight: true,
      kanTenGod: undefined,             shiTenGod: bazi.dayShiTenGod,  twelve: bazi.dayTwelve,
      zangGan: bazi.dayZangGan,   zangGanTenGods: zangTenGods(bazi.dayZangGan),
      specialStars: bazi.specialStars.dayPillar ?? [] },
    { label: t('profile.pillar_hour'),  kan: bazi.hourKan,  shi: bazi.hourShi,  kanElem: bazi.hourKanElem,  shiElem: bazi.hourShiElem,
      kanTenGod: bazi.hourKanTenGod,   shiTenGod: bazi.hourShiTenGod, twelve: bazi.hourTwelve,
      zangGan: bazi.hourZangGan,  zangGanTenGods: zangTenGods(bazi.hourZangGan),
      specialStars: bazi.specialStars.hourPillar ?? [] },
  ]

  const generateAiReading = async () => {
    if (!isPremium) { router.push('/premium'); return }
    setIsGenerating(true); setAiText('')
    try {
      const res = await fetch('/api/bazi-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayMaster: bazi.dayMaster, dayMasterElement: bazi.dayMasterElement,
          dayMasterName: bazi.dayMasterName,
          pillars: pillars.map(p => ({ label: p.label, kan: p.kan, shi: p.shi })),
          bodyStrength: body.label, yongShen: yong.yongShen, jiShen: yong.jiShen,
          wuxingCount: bazi.wuxingCount,
          yearFortune: { theme: year.theme, tenGodKan: year.tenGodKan },
          moonPhase: moon.phaseLabel,
        }),
      })
      if (!res.ok || !res.body) throw new Error('stream failed')
      const reader = res.body.getReader(); const dec = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setAiText(p => p + dec.decode(value, { stream: true }))
      }
    } catch { setAiText('AIリーディングの生成に失敗しました。') }
    finally { setIsGenerating(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── プロフィールヘッダー ─────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(196,160,96,0.1)', border: `1.5px solid ${C.bdrSt}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.serif, fontSize: '20px', color: C.gold,
          }}>
            {profile.name ? profile.name[0] : '月'}
          </div>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: '18px', color: C.goldLt, marginBottom: '3px' }}>{profile.name || t('profile.daymaster')}</div>
            <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim }}>{profile.birthDate}{profile.birthTime && ` ${profile.birthTime}`} {t('profile.born')}</div>
          </div>
          <button onClick={onEdit} style={{ marginLeft: 'auto', fontFamily: C.sans, fontSize: '11px', color: C.goldMt, background: 'none', border: `1px solid ${C.bdr}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}>{t('profile.edit')}</button>
        </div>
      </Card>

      {/* ── 四柱グリッド ─────────────────────── */}
      <Card>
        <SectionLabel>{t('profile.pillar_year')} / {t('profile.pillar_month')} / {t('profile.pillar_day')} / {t('profile.pillar_hour')}</SectionLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          {pillars.map(p => <PillarColumn key={p.label} {...p} />)}
        </div>
        {/* 節入り日補正注記 */}
        <div style={{
          marginTop: '10px',
          fontFamily: C.sans,
          fontSize: '10px',
          color: C.goldDim,
          textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          {isZhTW
            ? '※ 月柱已根據節入日修正（2020–2030年）'
            : '※ 月柱は節入り日で補正済み（2020〜2030年）'}
        </div>
      </Card>

      {/* ── 納音 ─────────────────────────────── */}
      <Card>
        <SectionLabel>{isZhTW ? '納音' : '納音（ないん）'}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: t('profile.pillar_year'),  nayin: bazi.yearNayin },
            { label: t('profile.pillar_month'), nayin: bazi.monthNayin },
            { label: t('profile.pillar_day'),   nayin: bazi.dayNayin },
            { label: t('profile.pillar_hour'),  nayin: bazi.hourNayin },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(196,160,96,0.04)', borderRadius: '8px', padding: '8px 10px',
              border: `1px solid ${C.bdr}`,
            }}>
              <span style={{ fontFamily: C.sans, fontSize: '9px', color: C.goldDim, minWidth: '22px' }}>{item.label}</span>
              <span style={{ fontFamily: C.serif, fontSize: '12px', color: C.goldLt }}>{item.nayin}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontFamily: C.sans, fontSize: '10px', color: C.goldDim, lineHeight: 1.6 }}>
          {isZhTW
            ? '納音是由天干地支組合而成的60種生命能量之聲，代表先天的氣質與才能。'
            : '納音は60干支の組み合わせから導かれる先天的な気質・才能の象徴です。'}
        </div>
      </Card>

      {/* ── 空亡 ─────────────────────────────── */}
      <Card>
        <SectionLabel>{isZhTW ? '空亡（旬空）' : '空亡（くうぼう）'}</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {bazi.kuuBou.map(k => (
            <div key={k} style={{
              fontFamily: C.serif, fontSize: '20px', color: '#c06060',
              background: 'rgba(192,96,96,0.08)', border: '1px solid rgba(192,96,96,0.3)',
              borderRadius: '8px', padding: '8px 16px',
            }}>{k}</div>
          ))}
          <div style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldMt, lineHeight: 1.7 }}>
            {isZhTW
              ? `日柱（${bazi.dayKan}${bazi.dayShi}）の旬中、${bazi.kuuBou.join('・')}が空亡。\n這些地支的運勢能量暫時減弱，需特別注意。`
              : `日柱（${bazi.dayKan}${bazi.dayShi}）の旬中、${bazi.kuuBou.join('・')}が空亡。\nこの地支が巡ってくる年・月は慎重さが必要。`}
          </div>
        </div>
      </Card>

      {/* ── 日主カード ───────────────────────── */}
      <div style={{
        background: dm.bg, border: `1px solid ${dm.text}44`,
        borderRadius: '14px', padding: '24px',
      }}>
        <SectionLabel>{t('profile.daymaster')}</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: C.serif, fontSize: '52px', color: dm.text, lineHeight: 1, textShadow: `0 0 30px ${dm.text}66` }}>{bazi.dayMaster}</div>
          <div>
            {(() => {
              const dmDisplay = isZhTW
                ? (DM_INFO_ZH[bazi.dayMaster] ?? { name: bazi.dayMasterName.split(' — ')[0], desc: bazi.dayMasterName.split(' — ')[1] ?? '' })
                : { name: bazi.dayMasterName.split(' — ')[0], desc: bazi.dayMasterName.split(' — ')[1] ?? '' }
              return (
                <>
                  <div style={{ fontFamily: C.serif, fontSize: '16px', color: C.goldLt, marginBottom: '6px' }}>{dmDisplay.name}</div>
                  <div style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.8 }}>{dmDisplay.desc}</div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ── 五行バランス ─────────────────────── */}
      <Card>
        <SectionLabel>{t('profile.wuxing')}</SectionLabel>
        <WuxingBar wuxing={bazi.wuxingCount} />
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(bazi.wuxingCount).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ElemBadge elem={k} size="md" />
              <span style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 身強・身弱 + 用神・忌神・喜神 ─── */}
      <Card>
        <SectionLabel>{t('profile.body_strength')}</SectionLabel>
        {/* 身強弱バッジ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              padding: '4px 14px', borderRadius: '6px',
              background: body.strength === 'strong' ? 'rgba(90,154,58,0.15)' : 'rgba(74,122,192,0.15)',
              border: `1px solid ${body.strength === 'strong' ? 'rgba(90,154,58,0.4)' : 'rgba(74,122,192,0.4)'}`,
              fontFamily: C.sans, fontSize: '12px', fontWeight: 700,
              color: body.strength === 'strong' ? '#5a9a3a' : '#4a7ac0',
            }}>{body.strength === 'strong' ? t('profile.strong') : t('profile.weak')}</div>
            <span style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim }}>
              {isZhTW ? `月支${bazi.monthShi}・分數${body.score.toFixed(1)}` : `月支${bazi.monthShi}・スコア${body.score.toFixed(1)}`}
            </span>
          </div>
          <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.7, margin: '0 0 16px' }}>{bodyDesc}</p>
        {/* 用神・忌神・喜神 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: t('profile.yongshen'), sublabel: t('profile.yongshen_sub'), elem: yong.yongShenElem, text: yong.yongShen, desc: yongDesc, reason: yongReason, accent: true },
            { label: t('profile.jishen'),   sublabel: t('profile.jishen_sub'),   elem: yong.jiShenElem,  text: yong.jiShen,   desc: null, reason: null, accent: false },
            { label: t('profile.xishen'),   sublabel: t('profile.xishen_sub'),   elem: yong.xiShenElem,  text: yong.xiShen,   desc: null, reason: null, accent: false },
          ].map(item => {
            const s = ELEMENT_STYLE[item.elem]
            return (
              <div key={item.label} style={{
                padding: '12px 16px', borderRadius: '10px',
                background: item.accent ? `${s?.bg ?? C.bgDeep}` : 'rgba(196,160,96,0.03)',
                border: `1px solid ${item.accent ? `${s?.text ?? C.gold}44` : C.bdr}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: item.desc ? '8px' : '0' }}>
                  <span style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.1em', minWidth: '28px' }}>{item.label}</span>
                  <ElemBadge elem={item.elem} size="md" />
                  <span style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldMt }}>{item.sublabel}</span>
                </div>
                  {item.desc && (
                    <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.8, margin: '0 0 6px', paddingLeft: '38px' }}>{item.desc}</p>
                  )}
                  {item.reason && (
                    <p style={{ fontFamily: C.sans, fontSize: '11px', color: C.goldDim, lineHeight: 1.6, margin: '0', paddingLeft: '38px' }}>{item.reason}</p>
                  )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── 2026年 流年運 ─────────────────────── */}
      <Card>
        <SectionLabel>{t('profile.year_fortune')}</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginBottom: '4px' }}>2026年</div>
            <div style={{ fontFamily: C.serif, fontSize: '28px', color: C.gold }}>丙午</div>
          </div>
          <div style={{ width: '1px', height: '48px', background: C.bdr }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontFamily: C.sans, fontSize: '11px', padding: '3px 10px',
                background: 'rgba(196,160,96,0.1)', border: `1px solid ${C.bdrSt}`,
                borderRadius: '4px', color: C.gold, letterSpacing: '0.06em',
              }}>{year.tenGodKan}</span>
              <span style={{ fontFamily: C.serif, fontSize: '16px', color: C.goldLt }}>{yearTheme}</span>
            </div>
            <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.8, margin: 0 }}>{yearAdvice}</p>
          </div>
        </div>
        {/* ラッキーアクション */}
        <div style={{ background: 'rgba(196,160,96,0.04)', border: `1px solid ${C.bdr}`, borderRadius: '8px', padding: '14px 16px' }}>
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, marginBottom: '10px', letterSpacing: '0.1em' }}>{t('profile.year_luck_action')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {yearActions.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: C.gold, fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>✦</span>
                <span style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, lineHeight: 1.7 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── 月フェーズ別相性（8フェーズ全て） ── */}
      <Card>
        <SectionLabel>{t('profile.moon_guide')}</SectionLabel>
        <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, marginBottom: '16px', lineHeight: 1.7 }}>
          {t('profile.moon_guide_sub_ja', { master: bazi.dayMaster, elem: ELEMENT_LABEL[bazi.dayMasterElement] ?? '' })}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {MOON_PHASE_ORDER.map(phase => (
            <MoonPhaseCard
              key={phase}
              phase={phase}
              advice={moons[phase] ?? { score: 70, action: isZhTW ? '內省與行動的平衡' : '内省と行動のバランスを', avoid: isZhTW ? '極端的選擇' : '極端な選択' }}
              isActive={moon.phase === phase}
            />
          ))}
        </div>
      </Card>

      {/* ── AIによる命式総合解説 ─────────────── */}
      <Card>
        <SectionLabel>{t('profile.ai_reading')}</SectionLabel>
        {!aiText && !isGenerating && (
          <>
            {isPremium ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, lineHeight: 1.8, marginBottom: '20px' }}>
                  {t('profile.ai_reading_sub')}
                </p>
                <button
                  onClick={generateAiReading}
                  style={{
                    padding: '13px 36px', background: C.gold, border: 'none',
                    borderRadius: '10px', color: C.bg, fontFamily: C.sans,
                    fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                  }}
                >
                  {t('profile.ai_reading_btn')}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
                <p style={{ fontFamily: C.sans, fontSize: '13px', color: C.goldMt, lineHeight: 1.8, marginBottom: '20px' }}>
                  {t('profile.ai_premium_msg')}
                </p>
                <button
                  onClick={() => router.push('/premium')}
                  style={{
                    padding: '12px 32px', background: 'transparent',
                    border: `1px solid ${C.bdrSt}`, borderRadius: '10px',
                    color: C.gold, fontFamily: C.sans, fontSize: '13px',
                    letterSpacing: '0.06em', cursor: 'pointer',
                  }}
                >
                  {t('profile.ai_see_plans')}
                </button>
              </div>
            )}
          </>
        )}

        {isGenerating && (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            {/* 月的アニメーション */}
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
              {LOADING_MESSAGES[loadingMsgIndex]}
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

        {aiText && !isGenerating && (
          <div style={{ fontFamily: C.serif }}>
            <ReactMarkdown components={{
              p:      ({ children }) => <p style={{ marginBottom: '1rem', lineHeight: 2.0, color: '#c8b88a', fontFamily: C.serif, fontSize: '14px', letterSpacing: '0.04em' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: C.gold, fontWeight: 600 }}>{children}</strong>,
              h2:     ({ children }) => <h2 style={{ color: C.gold, fontSize: '15px', marginBottom: '10px', marginTop: '20px', fontFamily: C.serif, borderBottom: `1px solid ${C.bdr}`, paddingBottom: '8px' }}>{children}</h2>,
            }}>
              {aiText}
            </ReactMarkdown>
            <button
              onClick={() => { setAiText(''); setIsGenerating(false) }}
              style={{ marginTop: '16px', fontFamily: C.sans, fontSize: '11px', color: C.goldMt, background: 'none', border: `1px solid ${C.bdr}`, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}
            >
              {t('profile.ai_regenerate')}
            </button>
          </div>
        )}
      </Card>

      {/* 命式変更ボタン */}
      <button
        onClick={onEdit}
        style={{
          width: '100%', padding: '12px', background: 'transparent',
          border: `1px solid ${C.bdr}`, borderRadius: '10px',
          color: C.goldMt, fontFamily: C.sans, fontSize: '12px',
          cursor: 'pointer', letterSpacing: '0.06em',
        }}
      >
        {t('profile.edit_bazi')}
      </button>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { t } = useLocale()
  const [moon, setMoon]         = useState<MoonPhaseData | null>(null)
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [bazi, setBazi]         = useState<BaziResult | null>(null)
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    setMoon(calculateMoonPhase())
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const p = JSON.parse(saved) as ProfileData
        setProfile(p)
        computeBazi(p)
        setShowForm(false)
      }
    } catch { /* ignore */ }
  }, [])

  const computeBazi = (p: ProfileData) => {
    const d    = new Date(p.birthDate)
    const hour = p.birthTime ? parseInt(p.birthTime.split(':')[0], 10) : 12
    setBazi(calculateBazi(d, hour))
  }

  const handleSave = (p: ProfileData) => {
    setProfile(p)
    computeBazi(p)
    setShowForm(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.goldLt }}>
      <Navbar />

      {/* ページヘッダー */}
      <div style={{ borderBottom: '1px solid rgba(196,160,96,0.1)', padding: '24px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.2em', marginBottom: '6px' }}>PROFILE</div>
          <h1 style={{ fontFamily: C.serif, fontSize: '26px', fontWeight: 300, color: C.goldLt, marginBottom: '5px' }}>{t('profile.title')}</h1>
          <p style={{ fontFamily: C.sans, fontSize: '12px', color: C.goldMt, margin: 0 }}>{t('profile.sub')}</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px)' }}>
        {showForm ? (
          <div style={{ background: C.bgCard, border: `1px solid ${C.bdr}`, borderRadius: '16px', padding: '28px 32px' }}>
            <div style={{ fontFamily: C.sans, fontSize: '10px', color: C.goldDim, letterSpacing: '0.15em', marginBottom: '24px' }}>{t('profile.register_sub')}</div>
            <ProfileForm onSave={handleSave} />
          </div>
        ) : (
          profile && bazi && moon && (
            <BaziResultView profile={profile} bazi={bazi} moon={moon} onEdit={() => setShowForm(true)} />
          )
        )}
      </div>
    </div>
  )
}
