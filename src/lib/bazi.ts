// 四柱推命 計算ロジック

export interface BaziResult {
  yearKan:  string; yearShi:  string; yearKanElem:  string; yearShiElem:  string
  monthKan: string; monthShi: string; monthKanElem: string; monthShiElem: string
  dayKan:   string; dayShi:   string; dayKanElem:   string; dayShiElem:   string
  hourKan:  string; hourShi:  string; hourKanElem:  string; hourShiElem:  string
  dayMaster: string
  dayMasterElement: string
  dayMasterName: string
  wuxingCount: Record<string, number>
}

const TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const DIZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const TG_ELEM = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water']
const DZ_ELEM = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water']

const DM_INFO: Record<string, string> = {
  '甲': '大樹 — 真っ直ぐ上へ伸びる大木。リーダーシップと理想主義。',
  '乙': '草花 — しなやかに適応する柔軟さ。人間関係の才と芸術性。',
  '丙': '太陽 — 明るく周囲を照らすカリスマ。表現力と行動力。',
  '丁': '灯火 — 静かに確実に照らす知性。洞察力と繊細な感受性。',
  '戊': '大山 — 動かない大地の安定感。包容力と忍耐と実直さ。',
  '己': '田畑 — 育む土のエネルギー。他者の才能を引き出す力。',
  '庚': '鉱石 — 鋭く強く改革を起こす。決断力と強い意志。',
  '辛': '宝石 — 磨かれた美しさ。審美眼と完璧主義と繊細さ。',
  '壬': '大海 — 広大で深い知恵の海。知性と柔軟性と包容力。',
  '癸': '雨露 — 細やかに浸透する直感力。感受性と神秘性と癒し。',
}


/** 繁體中文版 日主説明 */
export const DM_INFO_ZH: Record<string, { name: string; desc: string }> = {
  '甲': { name: '大樹（甲木）', desc: '像一棵筆直向上生長的大樹。具領導力與理想主義，想像力豐富。' },
  '乙': { name: '花草（乙木）', desc: '如花草般柔軟適應。擅長人際關係與藝術，感性細膩。' },
  '丙': { name: '太陽（丙火）', desc: '如太陽般熱情照耀。表現力與行動力極強，魅力十足。' },
  '丁': { name: '燭火（丁火）', desc: '如燭火般溫和持續地照亮。洞察力深厚，感受性細膩。' },
  '戊': { name: '山嶽（戊土）', desc: '如大山般平穩可靠。包容力與耐力強，誠實可信。' },
  '己': { name: '田土（己土）', desc: '如沃野的田地般孕育。擅長發揮他人才能，低調謙遜。' },
  '庚': { name: '礦石（庚金）', desc: '如利劍般銳利剛強。決斷力與改革力強，氣度剛毅。' },
  '辛': { name: '寶石（辛金）', desc: '如經過雕琢的寶石般閃耀。審美感強，追求完美與精緻。' },
  '壬': { name: '大海（壬水）', desc: '如浩瀚大海般包羅萬象。智慧與柔韌並存，包容力極強。' },
  '癸': { name: '雨露（癸水）', desc: '如細雨輕露般溫柔滲透。直覺敏銳，具積學與先見之明。' },
}

export const ELEMENT_LABEL: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
}

export const ELEMENT_STYLE: Record<string, { bg: string; text: string }> = {
  wood:  { bg: '#1a2a14', text: '#5a9a3a' },
  fire:  { bg: '#2a1414', text: '#c06060' },
  earth: { bg: '#2a2014', text: '#b08040' },
  metal: { bg: '#1e1e14', text: '#888860' },
  water: { bg: '#141a2a', text: '#4a7ac0' },
}

// 月相 × 日主 相性メッセージ
const COMPATIBILITY: Record<string, Record<string, string>> = {
  wood: {
    newMoon:      '木のエネルギーが新月と共鳴。新しい計画を立てるのに最適な夜です。',
    waxingCrescent:'成長への意欲が高まっています。行動を起こすタイミングが整いつつあります。',
    firstQuarter: '試練を乗り越える力が湧いています。迷ったら前進を選びましょう。',
    waxingGibbous:'目標達成まであと一息。粘り強さを発揮する時期です。',
    fullMoon:     '木は満月の光に最も反応します。感情と創造性が溢れ出す夜です。',
    waningGibbous:'学びを深め、感謝を表現する時期。周囲への恩返しを意識して。',
    lastQuarter:  '不要なものを手放す時。人間関係の整理にも良い時期です。',
    waningCrescent:'次のサイクルへの準備期間。休養と内省を大切に。',
  },
  fire: {
    newMoon:      '火の意志が静かに燃える新月。内なる情熱を見つめ直す夜です。',
    waxingCrescent:'エネルギーが高まっています。アイデアを形にし始めましょう。',
    firstQuarter: '炎が強く燃える時。決断と行動力が増幅されています。',
    waxingGibbous:'熱量が最高潮に向かいます。情熱を持って突き進む時期です。',
    fullMoon:     '火と満月が重なり感情が激しく動きます。冷静さも忘れずに。',
    waningGibbous:'情熱を分かち合う時期。教えること、伝えることが吉です。',
    lastQuarter:  '燃え尽きたものを手放して。執着よりも軽やかさを選びましょう。',
    waningCrescent:'炎は静かに次の火種を温めています。焦らず充電を。',
  },
  earth: {
    newMoon:      '大地が新たな種を待つ時。具体的な目標を書き出してみましょう。',
    waxingCrescent:'着実に根を張るように。毎日の積み重ねが力になります。',
    firstQuarter: '堅実な判断力が冴える時期。実務と計画の見直しに最適です。',
    waxingGibbous:'努力が実り始めています。信頼関係を深めることが大切な時。',
    fullMoon:     '土は満月の引力で豊かに実ります。成果を受け取る準備を。',
    waningGibbous:'蓄積した知識や経験を整理する時期。教える立場になるチャンス。',
    lastQuarter:  '土台を固め直す時。不安定な部分を見つけて補強しましょう。',
    waningCrescent:'静かに内側を耕す時期。瞑想や読書が心に栄養を与えます。',
  },
  metal: {
    newMoon:      '金のエネルギーが研ぎ澄まされる新月。新しいルールを設定するのに良い時。',
    waxingCrescent:'鋭い判断力が増しています。不要なものを削ぎ落とす作業に向いています。',
    firstQuarter: '改革の意志が強まる時。変えたかったことに踏み出すタイミングです。',
    waxingGibbous:'完成度へのこだわりが高まります。仕上げの磨きをかける時期。',
    fullMoon:     '金は満月の光を最も美しく反射します。自己表現が輝く夜。',
    waningGibbous:'結果を振り返り基準を見直す時期。より良い方法を探求しましょう。',
    lastQuarter:  '古いシステムや考え方を断ち切る時。革新の種を蒔きましょう。',
    waningCrescent:'内省と整頓の時間。空間と心を整えることで次の月が輝きます。',
  },
  water: {
    newMoon:      '水は新月に最も敏感に反応します。直感を信じて静かに意図を設定して。',
    waxingCrescent:'流れが変わり始めています。柔軟に状況に対応することが鍵です。',
    firstQuarter: '水の知恵が試される時。感情と理性のバランスを保ちながら進みましょう。',
    waxingGibbous:'深い洞察力が高まっています。人の本音が見えやすい時期です。',
    fullMoon:      '水と満月は最も強く共鳴します。感受性が極限まで高まる夜。心を守って。',
    waningGibbous:'癒しと浄化の時期。過去の感情を手放し心を洗い流しましょう。',
    lastQuarter:  '執着していた感情を流し去る時。手放すことで新しい流れが生まれます。',
    waningCrescent:'深海のように静かに内省する時。夢や直感のメッセージを大切に。',
  },
}

export function getCompatibilityMessage(
  dayMasterElement: string,
  moonPhase: string,
): string {
  return COMPATIBILITY[dayMasterElement]?.[moonPhase]
    ?? '月のエネルギーとあなたの命式が静かに対話しています。'
}

// ── 節入り日テーブル（UTC 日付で月番号を保持）2020〜2030年 ─────────────────
// 各エントリ = 「その日が節入り（＝この月の開始日）」を意味する
// 月番号: 1=小寒月, 2=立春月, ..., 12=大雪月
const SEKKI_TABLE: Record<string, number> = {
  // 2020年
  '2020-01-06': 1, '2020-02-04': 2, '2020-03-05': 3,
  '2020-04-04': 4, '2020-05-05': 5, '2020-06-05': 6,
  '2020-07-06': 7, '2020-08-07': 8, '2020-09-07': 9,
  '2020-10-08': 10, '2020-11-07': 11, '2020-12-07': 12,
  // 2021年
  '2021-01-05': 1, '2021-02-03': 2, '2021-03-05': 3,
  '2021-04-04': 4, '2021-05-05': 5, '2021-06-05': 6,
  '2021-07-07': 7, '2021-08-07': 8, '2021-09-07': 9,
  '2021-10-08': 10, '2021-11-07': 11, '2021-12-07': 12,
  // 2022年
  '2022-01-05': 1, '2022-02-04': 2, '2022-03-05': 3,
  '2022-04-05': 4, '2022-05-05': 5, '2022-06-06': 6,
  '2022-07-07': 7, '2022-08-07': 8, '2022-09-08': 9,
  '2022-10-08': 10, '2022-11-07': 11, '2022-12-07': 12,
  // 2023年
  '2023-01-06': 1, '2023-02-04': 2, '2023-03-06': 3,
  '2023-04-05': 4, '2023-05-06': 5, '2023-06-06': 6,
  '2023-07-07': 7, '2023-08-08': 8, '2023-09-08': 9,
  '2023-10-08': 10, '2023-11-08': 11, '2023-12-07': 12,
  // 2024年
  '2024-01-06': 1, '2024-02-04': 2, '2024-03-05': 3,
  '2024-04-04': 4, '2024-05-05': 5, '2024-06-05': 6,
  '2024-07-06': 7, '2024-08-07': 8, '2024-09-07': 9,
  '2024-10-08': 10, '2024-11-07': 11, '2024-12-06': 12,
  // 2025年
  '2025-01-05': 1, '2025-02-03': 2, '2025-03-05': 3,
  '2025-04-04': 4, '2025-05-05': 5, '2025-06-05': 6,
  '2025-07-07': 7, '2025-08-07': 8, '2025-09-07': 9,
  '2025-10-08': 10, '2025-11-07': 11, '2025-12-07': 12,
  // 2026年
  '2026-01-05': 1, '2026-02-04': 2, '2026-03-06': 3,
  '2026-04-05': 4, '2026-05-05': 5, '2026-06-06': 6,
  '2026-07-07': 7, '2026-08-07': 8, '2026-09-08': 9,
  '2026-10-08': 10, '2026-11-07': 11, '2026-12-07': 12,
  // 2027年
  '2027-01-06': 1, '2027-02-04': 2, '2027-03-06': 3,
  '2027-04-05': 4, '2027-05-06': 5, '2027-06-06': 6,
  '2027-07-07': 7, '2027-08-08': 8, '2027-09-08': 9,
  '2027-10-08': 10, '2027-11-08': 11, '2027-12-07': 12,
  // 2028年
  '2028-01-06': 1, '2028-02-04': 2, '2028-03-05': 3,
  '2028-04-04': 4, '2028-05-05': 5, '2028-06-05': 6,
  '2028-07-06': 7, '2028-08-07': 8, '2028-09-07': 9,
  '2028-10-07': 10, '2028-11-07': 11, '2028-12-06': 12,
  // 2029年
  '2029-01-05': 1, '2029-02-03': 2, '2029-03-05': 3,
  '2029-04-04': 4, '2029-05-05': 5, '2029-06-05': 6,
  '2029-07-07': 7, '2029-08-07': 8, '2029-09-07': 9,
  '2029-10-08': 10, '2029-11-07': 11, '2029-12-07': 12,
  // 2030年
  '2030-01-05': 1, '2030-02-04': 2, '2030-03-06': 3,
  '2030-04-05': 4, '2030-05-05': 5, '2030-06-06': 6,
  '2030-07-07': 7, '2030-08-07': 8, '2030-09-08': 9,
  '2030-10-08': 10, '2030-11-07': 11, '2030-12-07': 12,
}

/**
 * 節入り日テーブルを使って「命式上の月番号」を返す。
 * 節入り日前 → 前月扱い。テーブル範囲外の年は通常月をそのまま返す。
 */
function getMonthFromSekki(date: Date): number {
  const year  = date.getFullYear()
  const month = date.getMonth() + 1  // 1-12
  const day   = date.getDate()

  // その年月の節入り日を検索
  const sekkiDay = (() => {
    for (const key of Object.keys(SEKKI_TABLE)) {
      const [y, m, d] = key.split('-').map(Number)
      if (y === year && m === month) return d
    }
    return null
  })()

  // テーブル範囲外 → 通常月番号をそのまま返す
  if (sekkiDay === null) return month

  // 節入り日「より前」の場合は前月扱い
  if (day < sekkiDay) {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear  = month === 1 ? year - 1 : year
    for (const key of Object.keys(SEKKI_TABLE)) {
      const [y, m] = key.split('-').map(Number)
      if (y === prevYear && m === prevMonth) return SEKKI_TABLE[key]
    }
    // 前月がテーブルにない（範囲外年の1月など）→ 前月番号を返す
    return prevMonth
  }

  // 節入り日以降 → 当月の節入り月番号
  return SEKKI_TABLE[Object.keys(SEKKI_TABLE).find(k => {
    const [y, m] = k.split('-').map(Number)
    return y === year && m === month
  })!]
}

export function calculateBazi(birthDate: Date, birthHour = 12): BaziResult {
  const year  = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1

  // 年柱: 1984年甲子基準
  const yKanIdx = ((year - 1984) % 10 + 10) % 10
  const yShiIdx = ((year - 1984) % 12 + 12) % 12

  // 月柱（節入り日で補正した月番号を使用）
  const correctedMonth = getMonthFromSekki(birthDate)
  const mShiIdx  = (correctedMonth + 1) % 12
  const mBaseKan = [0, 2, 4, 6, 8][yKanIdx % 5]
  const mKanIdx  = (mBaseKan + correctedMonth - 1) % 10

  // 日柱: 1900年1月1日基準
  const base = new Date(1900, 0, 1)
  const diff = Math.floor((birthDate.getTime() - base.getTime()) / 86400000)
  const dKanIdx = ((diff % 10) + 10) % 10
  const dShiIdx = ((diff % 12) + 12) % 12

  // 時柱
  const hShiIdx  = Math.floor((birthHour + 1) / 2) % 12
  const hBaseKan = [0, 2, 4, 6, 8][dKanIdx % 5]
  const hKanIdx  = (hBaseKan + hShiIdx) % 10

  // 五行カウント
  const wuxingCount: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  ;[
    TG_ELEM[yKanIdx], DZ_ELEM[yShiIdx],
    TG_ELEM[mKanIdx], DZ_ELEM[mShiIdx],
    TG_ELEM[dKanIdx], DZ_ELEM[dShiIdx],
    TG_ELEM[hKanIdx], DZ_ELEM[hShiIdx],
  ].forEach(e => wuxingCount[e]++)

  return {
    yearKan:  TIANGAN[yKanIdx], yearShi:  DIZHI[yShiIdx],
    yearKanElem: TG_ELEM[yKanIdx], yearShiElem: DZ_ELEM[yShiIdx],
    monthKan: TIANGAN[mKanIdx], monthShi: DIZHI[mShiIdx],
    monthKanElem: TG_ELEM[mKanIdx], monthShiElem: DZ_ELEM[mShiIdx],
    dayKan:   TIANGAN[dKanIdx], dayShi:   DIZHI[dShiIdx],
    dayKanElem: TG_ELEM[dKanIdx], dayShiElem: DZ_ELEM[dShiIdx],
    hourKan:  TIANGAN[hKanIdx], hourShi:  DIZHI[hShiIdx],
    hourKanElem: TG_ELEM[hKanIdx], hourShiElem: DZ_ELEM[hShiIdx],
    dayMaster:        TIANGAN[dKanIdx],
    dayMasterElement: TG_ELEM[dKanIdx],
    dayMasterName:    DM_INFO[TIANGAN[dKanIdx]] ?? '',
    wuxingCount,
  }
}

// ── 十神（日主との関係） ────────────────────────────────────────────────────
const SHENG: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' }
const KE:    Record<string, string> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' }

export function getTenGod(
  dayMasterElem: string,
  targetElem: string,
  isStem: boolean,
): string {
  if (dayMasterElem === targetElem)                             return isStem ? '比肩' : '劫財'
  if (SHENG[dayMasterElem] === targetElem)                      return isStem ? '食神' : '傷官'
  if (SHENG[targetElem]    === dayMasterElem)                   return isStem ? '偏印' : '印綬'
  if (KE[dayMasterElem]    === targetElem)                      return isStem ? '偏財' : '正財'
  if (KE[targetElem]       === dayMasterElem)                   return isStem ? '偏官' : '正官'
  return '不明'
}

// ── 身強・身弱判定（簡易版） ─────────────────────────────────────────────────
const SHENG_ORDER = ['wood', 'fire', 'earth', 'metal', 'water']

export function getBodyStrength(result: BaziResult): {
  strength: 'strong' | 'weak'
  label: string
  desc: string
} {
  const dmElem = result.dayMasterElement
  const prevIdx = (SHENG_ORDER.indexOf(dmElem) - 1 + 5) % 5
  const prevElem = SHENG_ORDER[prevIdx]
  const supportCount = (result.wuxingCount[dmElem] ?? 0) + (result.wuxingCount[prevElem] ?? 0)

  if (supportCount >= 4) {
    return {
      strength: 'strong',
      label: '身強',
      desc: '日主のエネルギーが強い。自立心と行動力が旺盛。財星・官星を活かす時期に運が開く。',
    }
  }
  return {
    strength: 'weak',
    label: '身弱',
    desc: '日主のエネルギーが弱め。サポートを受け入れることで力を発揮。印星・比劫の年に運気上昇。',
  }
}

// ── 用神・忌神・喜神 ─────────────────────────────────────────────────────────
export function getYongShen(result: BaziResult): {
  yongShen: string; yongShenElem: string; yongShenDesc: string
  jiShen: string;   jiShenElem: string
  xiShen: string;   xiShenElem: string
} {
  const ELEMS = ['wood', 'fire', 'earth', 'metal', 'water']
  const ELEM_JA: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
  const YONG_DESC: Record<string, string> = {
    wood:  '木の気を強化。成長・学習・新しい挑戦が運を開く。緑の植物を部屋に置くと◎',
    fire:  '火の気を強化。表現・行動・人前に出ることが運を開く。南向きの場所が吉',
    earth: '土の気を強化。安定・継続・基盤作りが運を開く。規則正しい生活が鍵',
    metal: '金の気を強化。整理・決断・質を高めることが運を開く。白・金色のアイテムが吉',
    water: '水の気を強化。直感・流れに乗る・学びが運を開く。水辺や入浴が開運行動',
  }

  // 最も少ない五行が用神、最も多い五行が忌神（簡易版）
  const sorted = [...ELEMS].sort((a, b) => (result.wuxingCount[a] ?? 0) - (result.wuxingCount[b] ?? 0))
  const yongElem = sorted[0]
  const jiElem   = sorted[4]
  // 喜神 = 用神を生じる五行
  const xiElemKey = Object.keys(SHENG).find(k => SHENG[k] === yongElem) ?? 'water'

  return {
    yongShen: ELEM_JA[yongElem], yongShenElem: yongElem, yongShenDesc: YONG_DESC[yongElem] ?? '',
    jiShen:   ELEM_JA[jiElem],  jiShenElem: jiElem,
    xiShen:   ELEM_JA[xiElemKey], xiShenElem: xiElemKey,
  }
}

// ── 今年の流年運（2026年 = 丙午年） ─────────────────────────────────────────
const YEAR_FORTUNE_THEMES: Record<string, { theme: string; advice: string; actions: string[] }> = {
  '比肩': { theme: '自立と競争の年',     advice: '自分の力を信じて独立・起業・新プロジェクトに挑戦する時。ライバルにも注意。',  actions: ['独立・起業の計画を立てる', '自分のブランドを磨く', '競合調査と差別化戦略'] },
  '劫財': { theme: '協力と切磋琢磨の年', advice: '仲間との協力が運を開く。ただし金銭の貸し借りには注意が必要。',              actions: ['信頼できるパートナーを見つける', '共同プロジェクトへの参加', '金銭管理の見直し'] },
  '食神': { theme: '表現と豊かさの年',   advice: '才能を発揮し楽しみながら仕事をすると運が開く。創作・料理・芸術が吉。',      actions: ['創作活動を始める', '食・美・芸術を楽しむ', '自分の得意を発信する'] },
  '傷官': { theme: '革新と才能開花の年', advice: '既存の枠を超える年。新しいスキル習得や転換が吉。権威との衝突に注意。',      actions: ['新スキルの習得', '革新的なアイデアを発表', 'SNSでの発信強化'] },
  '偏財': { theme: '行動と臨時収入の年', advice: '積極的な行動が金運を引き寄せる。投資・副業・新規事業が吉兆。',              actions: ['副業・投資の検討', '新市場への挑戦', '人脈拡大'] },
  '正財': { theme: '堅実と蓄財の年',     advice: 'コツコツと積み上げることで安定した収入が得られる。節約と貯蓄も意識して。',  actions: ['家計の見直し', '貯蓄計画の作成', '地道な実績の積み上げ'] },
  '偏官': { theme: '挑戦とプレッシャーの年', advice: '高い目標への挑戦が運を開く。困難も成長の糧。健康管理を怠らずに。',   actions: ['高い目標の設定', '体力・健康の強化', '逆境をチャンスと捉える'] },
  '正官': { theme: '信頼と昇進の年',     advice: '真面目に取り組む姿勢が評価される。キャリアアップ・資格取得が吉。',          actions: ['資格取得・スキルアップ', '上司や組織との信頼構築', '誠実な仕事ぶりを意識'] },
  '偏印': { theme: '学びと内省の年',     advice: 'スピリチュアル・学術・瞑想が充実する年。焦らず知識を蓄える時期。',          actions: ['読書・学習の習慣化', '瞑想・内省の時間を作る', '専門知識を深める'] },
  '印綬': { theme: '保護と知性の年',     advice: '人からのサポートを素直に受け取る年。勉強・資格・母親的存在との縁が深まる。', actions: ['師匠・メンターを探す', '勉強・資格取得', '感謝と受け取りの練習'] },
}

export function getYearFortune(result: BaziResult): {
  yearKan: string; yearShi: string
  tenGodKan: string; tenGodShi: string
  theme: string; advice: string; actions: string[]
} {
  const YEAR_KAN_ELEM = 'fire'
  const YEAR_SHI_ELEM = 'fire'

  const tenGodKan = getTenGod(result.dayMasterElement, YEAR_KAN_ELEM, true)
  const tenGodShi = getTenGod(result.dayMasterElement, YEAR_SHI_ELEM, false)

  const fortune = YEAR_FORTUNE_THEMES[tenGodKan] ?? {
    theme: '変化と成長の年',
    advice: '新しいサイクルが始まる年。柔軟に対応することで道が開ける。',
    actions: ['変化を恐れず受け入れる', '新しい出会いを大切に', '自分の軸を持つ'],
  }

  return { yearKan: '丙', yearShi: '午', tenGodKan, tenGodShi, ...fortune }
}

// ── 月フェーズ別パーソナライズメッセージ ────────────────────────────────────
export interface MoonPhaseAdvice {
  score: number
  action: string
  avoid: string
}

const MOON_PHASE_MESSAGES: Record<string, Record<string, MoonPhaseAdvice>> = {
  water: {
    newMoon:       { score: 95, action: '内省・瞑想・直感に従った新計画の立案',   avoid: '焦りや無理な行動' },
    waxingCrescent:{ score: 75, action: 'アイデアを少しずつ形にする・人に話す', avoid: '完璧主義による停滞' },
    firstQuarter:  { score: 70, action: '流れに乗った行動・コミュニケーション',   avoid: '感情的な判断' },
    waxingGibbous: { score: 65, action: '細部の調整・仕上げ・継続',               avoid: '拡散しすぎ' },
    fullMoon:      { score: 80, action: '感情の解放・感謝・人間関係の整理',       avoid: '感情の暴走' },
    waningGibbous: { score: 72, action: '学びのシェア・感謝を伝える',             avoid: '執着' },
    lastQuarter:   { score: 85, action: '断捨離・手放し・デジタルデトックス',     avoid: '新しいことを始める' },
    waningCrescent:{ score: 90, action: '休息・夢日記・内なる声を聴く',           avoid: '無理な社交' },
  },
  wood: {
    newMoon:       { score: 90, action: '新プロジェクトの種まき・ビジョン設定',   avoid: '過去への執着' },
    waxingCrescent:{ score: 85, action: '計画を行動に移す・学習開始',             avoid: '焦って結果を求める' },
    firstQuarter:  { score: 80, action: '決断・挑戦・新しい環境への一歩',         avoid: '優柔不断' },
    waxingGibbous: { score: 75, action: '成長の確認・軌道修正',                   avoid: '完璧主義' },
    fullMoon:      { score: 70, action: '成果の発表・人との繋がり強化',           avoid: '感情的衝突' },
    waningGibbous: { score: 68, action: '振り返り・感謝',                         avoid: '新規プロジェクト開始' },
    lastQuarter:   { score: 60, action: '不要なものを手放す',                     avoid: '新しい挑戦' },
    waningCrescent:{ score: 55, action: '休息・充電',                             avoid: '無理な行動' },
  },
  fire: {
    newMoon:       { score: 60, action: '静かな内省・次の表現の準備',             avoid: '衝動的な行動' },
    waxingCrescent:{ score: 75, action: '小さな表現・SNS発信・創作',             avoid: '一人で抱え込む' },
    firstQuarter:  { score: 90, action: '大胆な行動・プレゼン・人前に出る',       avoid: '慎重すぎる態度' },
    waxingGibbous: { score: 88, action: '情熱を持って継続・仲間を巻き込む',       avoid: '燃え尽き' },
    fullMoon:      { score: 95, action: '才能の全力発揮・お披露目・祝福',         avoid: '傲慢さ' },
    waningGibbous: { score: 80, action: '成功を分かち合う・感謝',                 avoid: '過去の栄光に縛られる' },
    lastQuarter:   { score: 65, action: 'クールダウン・整理',                     avoid: '無理な継続' },
    waningCrescent:{ score: 55, action: '充電・瞑想',                             avoid: 'エネルギーの消耗' },
  },
  earth: {
    newMoon:       { score: 70, action: '基盤作りの計画・長期目標設定',           avoid: '焦り' },
    waxingCrescent:{ score: 72, action: 'コツコツとした積み上げ',                 avoid: '大きすぎる変化' },
    firstQuarter:  { score: 75, action: '着実な前進・信頼関係の構築',             avoid: '衝動的決断' },
    waxingGibbous: { score: 78, action: '継続・改善・質の向上',                   avoid: '変化への抵抗' },
    fullMoon:      { score: 75, action: '成果の確認・人への感謝',                 avoid: '頑固さ' },
    waningGibbous: { score: 73, action: '不要な習慣を見直す',                     avoid: '執着' },
    lastQuarter:   { score: 80, action: '整理整頓・断捨離',                       avoid: '溜め込み' },
    waningCrescent:{ score: 82, action: '休息・自然の中での充電',                 avoid: '過労' },
  },
  metal: {
    newMoon:       { score: 75, action: '決意と意図の明確化',                     avoid: '優柔不断' },
    waxingCrescent:{ score: 65, action: '計画の精査・準備',                       avoid: '完璧主義による停滞' },
    firstQuarter:  { score: 62, action: '慎重な前進・品質重視',                   avoid: '衝動的行動' },
    waxingGibbous: { score: 68, action: '仕上げ・磨き上げ',                       avoid: '妥協' },
    fullMoon:      { score: 85, action: '成果の収穫・決断・区切り',               avoid: '感情的判断' },
    waningGibbous: { score: 82, action: '評価・フィードバック収集',               avoid: '批判的すぎる態度' },
    lastQuarter:   { score: 90, action: '不要なものの切断・整理',                 avoid: '優柔不断' },
    waningCrescent:{ score: 88, action: '浄化・瞑想・内省',                       avoid: '過度な完璧主義' },
  },
}

const MOON_PHASE_MESSAGES_ZH: Record<string, Record<string, MoonPhaseAdvice>> = {
  water: {
    newMoon:       { score: 95, action: '內省・冥想・依循直覺制定新計畫',         avoid: '焦急或勉強行動' },
    waxingCrescent:{ score: 75, action: '將想法逐步成形・和他人分享',             avoid: '因完美主義而停滯' },
    firstQuarter:  { score: 70, action: '順勢而行・加強溝通',                     avoid: '情緒化判斷' },
    waxingGibbous: { score: 65, action: '調整細節・完善收尾・持續行動',           avoid: '過度發散' },
    fullMoon:      { score: 80, action: '釋放情感・感恩・整理人際關係',           avoid: '情緒失控' },
    waningGibbous: { score: 72, action: '分享所學・傳達感謝',                     avoid: '執著' },
    lastQuarter:   { score: 85, action: '斷捨離・放下・數位排毒',                 avoid: '開始新事物' },
    waningCrescent:{ score: 90, action: '休息・寫夢境日記・傾聽內心聲音',         avoid: '強迫社交' },
  },
  wood: {
    newMoon:       { score: 90, action: '播下新企劃的種子・設定願景',             avoid: '執著於過去' },
    waxingCrescent:{ score: 85, action: '將計畫付諸行動・開始學習',               avoid: '急於求成' },
    firstQuarter:  { score: 80, action: '果斷決定・挑戰・踏入新環境',             avoid: '優柔寡斷' },
    waxingGibbous: { score: 75, action: '確認成長・修正軌道',                     avoid: '完美主義' },
    fullMoon:      { score: 70, action: '發表成果・強化與人的連結',               avoid: '情緒化衝突' },
    waningGibbous: { score: 68, action: '回顧・感恩',                             avoid: '開始新企劃' },
    lastQuarter:   { score: 60, action: '放下不需要的事物',                       avoid: '新的挑戰' },
    waningCrescent:{ score: 55, action: '休息・充電',                             avoid: '勉強行動' },
  },
  fire: {
    newMoon:       { score: 60, action: '靜心內省・準備下一次的表達',             avoid: '衝動行事' },
    waxingCrescent:{ score: 75, action: '小規模表達・社群發文・創作',             avoid: '一人獨自承擔' },
    firstQuarter:  { score: 90, action: '大膽行動・發表簡報・公開露面',           avoid: '過於謹慎' },
    waxingGibbous: { score: 88, action: '充滿熱情地持續・帶動夥伴',               avoid: '燃盡耗竭' },
    fullMoon:      { score: 95, action: '全力發揮才能・公開亮相・慶祝',           avoid: '驕傲自滿' },
    waningGibbous: { score: 80, action: '分享成功・傳達感謝',                     avoid: '沉溺於過去的榮耀' },
    lastQuarter:   { score: 65, action: '冷靜下來・整理',                         avoid: '勉強繼續' },
    waningCrescent:{ score: 55, action: '充電・冥想',                             avoid: '耗費能量' },
  },
  earth: {
    newMoon:       { score: 70, action: '規劃基礎建設・設定長期目標',             avoid: '焦急' },
    waxingCrescent:{ score: 72, action: '踏實地一步步積累',                       avoid: '過大的變化' },
    firstQuarter:  { score: 75, action: '穩健前進・建立信任關係',                 avoid: '衝動決策' },
    waxingGibbous: { score: 78, action: '持續・改善・提升品質',                   avoid: '抗拒變化' },
    fullMoon:      { score: 75, action: '確認成果・對人表達感謝',                 avoid: '固執' },
    waningGibbous: { score: 73, action: '重新檢視不必要的習慣',                   avoid: '執著' },
    lastQuarter:   { score: 80, action: '整理收納・斷捨離',                       avoid: '囤積' },
    waningCrescent:{ score: 82, action: '休息・在自然中充電',                     avoid: '過勞' },
  },
  metal: {
    newMoon:       { score: 75, action: '明確決心與意圖',                         avoid: '優柔寡斷' },
    waxingCrescent:{ score: 65, action: '精查計畫・做好準備',                     avoid: '因完美主義而停滯' },
    firstQuarter:  { score: 62, action: '謹慎前進・重視品質',                     avoid: '衝動行事' },
    waxingGibbous: { score: 68, action: '完善收尾・精益求精',                     avoid: '妥協' },
    fullMoon:      { score: 85, action: '收穫成果・做出決斷・劃下句點',           avoid: '情緒化判斷' },
    waningGibbous: { score: 82, action: '評估・收集回饋',                         avoid: '過於批判' },
    lastQuarter:   { score: 90, action: '切斷不必要的事物・整理',                 avoid: '優柔寡斷' },
    waningCrescent:{ score: 88, action: '淨化・冥想・內省',                       avoid: '過度完美主義' },
  },
}

export function getMoonPhaseMessages(
  dayMasterElement: string,
  locale?: string,
): Record<string, MoonPhaseAdvice> {
  const map = locale === 'zh-TW' ? MOON_PHASE_MESSAGES_ZH : MOON_PHASE_MESSAGES
  return map[dayMasterElement] ?? map.water
}

