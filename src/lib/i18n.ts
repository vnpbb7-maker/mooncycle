'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── 翻訳データ ────────────────────────────────────────────────────────────
export const translations = {
  ja: {
    nav: {
      reading: 'リーディング',
      calendar: '月暦',
      journal: '日記',
      profile: '命式',
      premium: 'Premium',
    },
    home: {
      badge: 'TODAY · {phase}',
      title1: '月のリズムと',
      title2: 'あなたの命式が',
      title3: '交差する場所',
      sub: '四柱推命の日主と月のフェーズを掛け合わせた、あなただけのパーソナル占いと癒しの体験。36枚のルノルマンカードが今日の流れを照らします。',
      cta1: 'カードを引く →',
      cta2: '命式を設定する',
      moonSign: '月星座',
      nextFull: '次の満月',
      nextNew: '次の新月',
      daysAfter: 'あと{days}日',
      todayTheme: '今日のテーマ',
    },
    lenormand: {
      title: 'ルノルマンとは',
      desc: 'ルノルマンカードは19世紀フランスで生まれた36枚のオラクルカード。タロットと異なり、カードを組み合わせて読むことで、より具体的・実践的なメッセージを受け取れます。',
      method1_title: '1枚引き',
      method1_sub: '今日のメッセージ',
      method1_desc: '1枚のカードから今日のエネルギーと方向性を受け取る。最もシンプルで毎日続けやすい読み方。',
      method2_title: '組み合わせ読み',
      method2_sub: '文脈で深める',
      method2_desc: '隣り合うカードを掛け合わせて読む。例: 樹木＋星＝長期的な希望・健康的な夢の実現',
      method3_title: 'スプレッド',
      method3_sub: '深層を読む',
      method3_desc: 'テーマ別のポジションにカードを配置し、状況全体の流れと核心を読み解く。',
    },
    todayCards: {
      label: "TODAY'S CARDS · 今日の6枚",
      sub: '毎日更新 · 月のエネルギーと今日の日付から選ばれた6枚',
    },
    reading: {
      title: 'スプレッドを選ぶ',
      sub: '問いの深さに合わせてスプレッドを選んでください',
      selectPrompt: 'スプレッドを選んでカードを引きましょう',
      tapHint: '🌙 カードをタップしてめくってください',
      free: 'FREE',
      premium: 'PREMIUM',
      generateReading: '🌙 AIリーディングを生成',
      generateGrand: '✨ AIグランタブローリーディング',
      allFlipped: 'すべてのカードがめくられました',
      grandReady: '36枚展開完了',
      grandBanner: '✨ 36枚全て表向きで展開されました。下のボタンからAIグランタブローリーディングを引いてください',
      regenerate: 'もう一度引き直す',
      upsell_title: '✦ もっと深く読みたいですか？',
      upsell_desc: '満月スプレッド・小テーブル・グランタブローなど6種のスプレッドとAIリーディング月50回がご利用いただけます',
      upsell_btn: 'プランを見る →',
      backToSpreads: '← スプレッドに戻る',
      moonReading: 'のリーディング',
      flippedCount: '枚めくりました',
      loading_msg1: 'カードのエネルギーを読み解いています...',
      loading_msg2: '月のフェーズと照らし合わせています...',
      loading_msg3: 'あなたへのメッセージを紡いでいます...',
      loading_msg4: '星々の声に耳を傾けています...',
      loading_msg5: 'カードの組み合わせを深く読んでいます...',
    },
    journal: {
      title: '月の日記',
      privacy_title: 'あなただけの記録',
      privacy_desc: 'ここに書いた内容は、このデバイスにのみ保存されます。サーバーに送信されることはなく、他の人と共有されることも一切ありません。安心して、心の声をそのままに。',
      tab_new: '🌑 新月の願掛け',
      tab_full: '🌕 満月の手放し',
      tab_history: '📜 過去の記録',
      save_new: '🌙 新月に刻む',
      save_full: '🔥 満月に手放す',
      saved_new: '✓ 保存しました',
      saved_full: '✓ 保存しました',
      local_only: 'この内容はあなたのデバイスにのみ保存されます',
      local_only_sub: '保存はこのブラウザ内のみ。外部には送信されません。',
      no_entries: 'まだ記録がありません',
      no_entries_sub: '新月・満月のたびに記録を積み重ねましょう',
      new_wish: '新月の願い',
      full_release: '満月の手放し',
      placeholder_new: '自由に書いてください...',
      placeholder_full: '満月の光に照らされながら、手放したいことを記録しましょう...',
      ritual_title: 'RITUAL STEPS',
      ritual_step1: '深呼吸を3回して、心を静める',
      ritual_step2: '手放したいものを記録する',
      ritual_step3: '「私はこれを手放します」と3回唱える',
      release_tags_title: '手放したいもの（複数選択可）',
      release_label: '今夜、手放すことを書いてください',
      q1: '今月、引き寄せたいことは？',
      q2: '手に入れたい感情・感覚は？',
      q3: 'そのために行動することは？',
      tag_fear: '恐れ',
      tag_attachment: '執着',
      tag_anger: '怒り',
      tag_regret: '後悔',
      tag_comparison: '比較',
      tag_self_crit: '自己批判',
      tag_tired: '疲れ',
      tag_anxiety: '不安',
      tag_jealousy: '嫉妬',
      tag_old_pattern: '古いパターン',
      filter_all: 'すべて',
      filter_new: '🌑 新月',
      filter_full: '🌕 満月',
      days_to_new: '次の新月まで',
      days_to_full: '次の満月まで',
      days_unit: '日',
      loading: '読み込み中...',
    },
    profile: {
      title: '命式プロフィール',
      sub: '四柱推命の命式を登録して、月のリーディングをパーソナライズ',
      name: 'お名前',
      birthdate: '生年月日',
      birthtime: '出生時刻（任意）',
      birthtime_hint: '不明な場合は正午（12:00）として計算されます',
      gender: '性別',
      female: '女性',
      male: '男性',
      other: 'その他',
      calculate: '🌙 命式を算出する',
      edit: '編集',
      edit_bazi: '命式を変更する',
      register_title: '命式プロフィールを登録',
      register_sub: '生年月日を入力することで、月のリーディングがよりパーソナルになります。',
      daymaster: '日主',
      pillar_year: '年柱',
      pillar_month: '月柱',
      pillar_day: '日柱',
      pillar_hour: '時柱',
      wuxing: '五行バランス',
      body_strength: '身強弱 · 用神',
      strong: '身強',
      weak: '身弱',
      yongshen: '用神',
      jishen: '忌神',
      xishen: '喜神',
      yongshen_sub: '強化すべき気 · 開運の方向性',
      jishen_sub: '過剰な気 · 注意すべきエネルギー',
      xishen_sub: '用神をサポートする気',
      year_fortune: '2026年 流年運',
      year_luck_action: '今年のラッキーアクション',
      moon_guide: '月フェーズ別 相性ガイド',
      moon_guide_sub_ja: '日主「{master}（{elem}）」と各月相のエネルギーの相性です。現在の月相をハイライトしています。',
      score: '相性スコア',
      do_action: 'やること',
      avoid_action: '避けること',
      ai_reading: 'AI 命式リーディング',
      ai_reading_sub: '命式の四柱・身強弱・用神・2026年流年をすべて統合した、あなただけの深い鑑定をAIが行います。',
      ai_reading_btn: '🌙 AIで命式を深く読む',
      ai_premium_msg: '命式AIリーディングはPremiumプラン限定です。四柱・用神・流年を統合した深い鑑定が受けられます。',
      ai_see_plans: 'プランを見る →',
      ai_regenerate: '再生成',
      born: '生',
      now_here: '← 今ここ',
      action_label: 'おすすめの行動',
      avoid_label: '控えたいこと',
      illumination: '輝面比',
      loading: '読み込み中...',
      loading_msg1: '星と照らし合わせてあなたの命式を読み解きます...',
      loading_msg2: '月のエネルギーと日主の関係を紐解いています...',
      loading_msg3: '2026年の天の流れを確認しています...',
      loading_msg4: '用神と忌神のバランスを分析しています...',
      loading_msg5: 'あなただけのメッセージを紡いでいます...',
    },
    calendar: {
      title: '月暦',
      full_moon: '満月',
      new_moon: '新月',
      sekki: '節入り',
    },
    premium: {
      title: 'MoonCycleを、もっと深く。',
      sub: '月のリズムとあなただけの命式が交差する、本格的な占いの体験へ',
      monthly: '月額',
      yearly: '年額',
      yearly_badge: '2ヶ月分お得',
      free_plan: '無料プラン',
      lite_plan: 'ライトプラン',
      premium_plan: 'プレミアムプラン',
      recommended: 'おすすめ',
      current_plan: '現在のプラン',
      start_lite: 'ライトプランを始める',
      start_premium: 'プレミアムプランを始める',
      restore: '以前ご購入のお客様はこちら → 購入を復元する',
      stripe_note: '※ お支払いはStripeにより安全に処理されます',
      cancel_note: '※ いつでもキャンセル可能です。解約後も期間終了まで利用できます',
    },
    footer: {
      copyright: 'MoonCycle © 2026',
      privacy: 'プライバシー',
      terms: '利用規約',
      contact: 'お問い合わせ',
    },
  },

  'zh-TW': {
    nav: {
      reading: '占卜解讀',
      calendar: '月曆',
      journal: '月亮日記',
      profile: '命盤',
      premium: 'Premium',
    },
    home: {
      badge: 'TODAY · {phase}',
      title1: '月亮的節奏',
      title2: '與你的命盤',
      title3: '交會之處',
      sub: '將四柱推命的日主與月相結合，為你帶來獨一無二的個人占卜與療癒體驗。36張雷諾曼牌為你照亮今日的流向。',
      cta1: '抽牌占卜 →',
      cta2: '設定命盤',
      moonSign: '月亮星座',
      nextFull: '下次滿月',
      nextNew: '下次新月',
      daysAfter: '還有{days}天',
      todayTheme: '今日主題',
    },
    lenormand: {
      title: '什麼是雷諾曼？',
      desc: '雷諾曼牌是19世紀法國誕生的36張神諭牌。與塔羅不同，透過組合牌卡來解讀，可以獲得更具體、更實用的訊息。',
      method1_title: '單張抽牌',
      method1_sub: '今日訊息',
      method1_desc: '從一張牌中接收今日的能量與方向。最簡單、最容易每天持續的解讀方式。',
      method2_title: '組合解讀',
      method2_sub: '深化脈絡',
      method2_desc: '將相鄰的牌組合起來解讀。例：樹木＋星星＝長期的希望・健康夢想的實現',
      method3_title: '牌陣',
      method3_sub: '讀取深層',
      method3_desc: '將牌卡放置在主題別的位置上，讀取整體情況的流向與核心。',
    },
    todayCards: {
      label: "TODAY'S CARDS · 今日6張",
      sub: '每日更新 · 由月亮能量與今日日期選出的6張牌',
    },
    reading: {
      title: '選擇牌陣',
      sub: '請根據問題的深度選擇牌陣',
      selectPrompt: '請選擇牌陣並抽牌',
      tapHint: '🌙 請點擊牌卡翻牌',
      free: '免費',
      premium: '付費',
      generateReading: '🌙 AI解讀生成',
      generateGrand: '✨ AI大牌陣解讀',
      allFlipped: '所有牌卡已翻開',
      grandReady: '36張展開完成',
      grandBanner: '✨ 36張全部正面展開。請點擊下方按鈕進行AI大牌陣解讀',
      regenerate: '重新抽牌',
      upsell_title: '✦ 想要更深入的解讀嗎？',
      upsell_desc: '滿月牌陣・小桌牌陣・大牌陣等6種牌陣，以及每月50次AI解讀',
      upsell_btn: '查看方案 →',
      backToSpreads: '← 返回牌陣',
      moonReading: '的解讀',
      flippedCount: '張已翻開',
      loading_msg1: '正在解讀牌卡的能量...',
      loading_msg2: '正在對照月相...',
      loading_msg3: '正在為您編織訊息...',
      loading_msg4: '正在傾聽星辰的聲音...',
      loading_msg5: '正在深度解讀牌卡組合...',
    },
    journal: {
      title: '月亮日記',
      privacy_title: '只屬於你的記錄',
      privacy_desc: '在此輸入的內容僅保存在這台設備上。不會傳送至伺服器，也不會與他人共享。請放心，盡情寫下內心的聲音。',
      tab_new: '🌑 新月許願',
      tab_full: '🌕 滿月釋放',
      tab_history: '📜 過去記錄',
      save_new: '🌙 刻印於新月',
      save_full: '🔥 於滿月釋放',
      saved_new: '✓ 已儲存',
      saved_full: '✓ 已儲存',
      local_only: '此內容僅保存在您的設備上',
      local_only_sub: '儲存僅限此瀏覽器內。不會傳送至外部。',
      no_entries: '尚無記錄',
      no_entries_sub: '請在新月・滿月時累積記錄',
      new_wish: '新月的願望',
      full_release: '滿月的釋放',
      placeholder_new: '請自由地寫下...',
      placeholder_full: '在滿月的光芒中，記錄你想釋放的事物...',
      ritual_title: 'RITUAL STEPS',
      ritual_step1: '深呼吸3次，靜下心來',
      ritual_step2: '寫下想釋放的事物',
      ritual_step3: '唱誦「我釋放這些」三次',
      release_tags_title: '想釋放的事（可多選）',
      release_label: '請寫下今晚想釋放的事物',
      q1: '這個月，你想吸引什麼？',
      q2: '想得到的情感・感覺是？',
      q3: '為此要採取的行動是？',
      tag_fear: '恐懼',
      tag_attachment: '執著',
      tag_anger: '憤怒',
      tag_regret: '後悔',
      tag_comparison: '比較',
      tag_self_crit: '自我批判',
      tag_tired: '疲憊',
      tag_anxiety: '不安',
      tag_jealousy: '嫉妒',
      tag_old_pattern: '舊模式',
      filter_all: '全部',
      filter_new: '🌑 新月',
      filter_full: '🌕 滿月',
      days_to_new: '下次新月內',
      days_to_full: '下次滿月內',
      days_unit: '天',
      loading: '載入中...',
    },
    profile: {
      title: '命盤設定',
      sub: '登錄四柱推命命盤，個人化月亮解讀',
      name: '姓名',
      birthdate: '出生日期',
      birthtime: '出生時間（選填）',
      birthtime_hint: '不明時以中午（12:00）計算',
      gender: '性別',
      female: '女性',
      male: '男性',
      other: '其他',
      calculate: '🌙 推算命盤',
      edit: '編輯',
      edit_bazi: '修改命盤',
      register_title: '命盤設定',
      register_sub: '輸入生日後，月亮解讀將更加個人化。',
      daymaster: '日主',
      pillar_year: '年柱',
      pillar_month: '月柱',
      pillar_day: '日柱',
      pillar_hour: '時柱',
      wuxing: '五行平衡',
      body_strength: '身強弱 · 用神',
      strong: '身強',
      weak: '身弱',
      yongshen: '用神',
      jishen: '忌神',
      xishen: '喜神',
      yongshen_sub: '應強化之氣 · 開運方向',
      jishen_sub: '過旺之氣 · 應注意的能量',
      xishen_sub: '輸助用神之氣',
      year_fortune: '2026年 流年運勢',
      year_luck_action: '今年的幸運行動',
      moon_guide: '月相相性指南',
      moon_guide_sub_ja: '日主「{master}（{elem}）」與各月相能量的相性。目前月相已標示。',
      score: '相性評分',
      do_action: '該做的事',
      avoid_action: '避免的事',
      ai_reading: 'AI 命盤解讀',
      ai_reading_sub: '整合四柱・身強弱・用神・2026年流年，AI為你進行專屬深度鑑定。',
      ai_reading_btn: '🌙 以AI深度解讀命盤',
      ai_premium_msg: '命盤AI解讀為Premium方案限定。可獲得整合四柱・用神・流年的深度鑑定。',
      ai_see_plans: '查看方案 →',
      ai_regenerate: '重新生成',
      born: '生',
      now_here: '← 現在',
      action_label: '推薦行動',
      avoid_label: '應避唔事項',
      illumination: '月相比例',
      loading: '載入中...',
      loading_msg1: '正在對照星象解讀您的命盤...',
      loading_msg2: '正在解析月亮能量與日主的關係...',
      loading_msg3: '正在確認2026年的天運走向...',
      loading_msg4: '正在分析用神與忌神的平衡...',
      loading_msg5: '正在為您編織專屬訊息...',
    },
    calendar: {
      title: '月曆',
      full_moon: '滿月',
      new_moon: '新月',
      sekki: '節氣',
    },
    premium: {
      title: '更深入地探索MoonCycle。',
      sub: '月亮節奏與你獨特命盤交會的，正統占卜體驗',
      monthly: '月付',
      yearly: '年付',
      yearly_badge: '省2個月',
      free_plan: '免費方案',
      lite_plan: '輕量方案',
      premium_plan: '高級方案',
      recommended: '推薦',
      current_plan: '目前方案',
      start_lite: '開始輕量方案',
      start_premium: '開始高級方案',
      restore: '曾經購買的用戶請點此 → 恢復購買',
      stripe_note: '※ 付款由Stripe安全處理',
      cancel_note: '※ 可隨時取消，取消後仍可使用至期限為止',
    },
    footer: {
      copyright: 'MoonCycle © 2026',
      privacy: '隱私政策',
      terms: '使用條款',
      contact: '聯絡我們',
    },
  },
} as const

export type Locale = keyof typeof translations
export type TranslationKeys = typeof translations.ja

// ─── ドット記法でネストキーを取得 ─────────────────────────────────────────
function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = obj
  for (const part of parts) {
    if (val == null) return key
    val = val[part]
  }
  return typeof val === 'string' ? val : key
}

// ─── useLocale フック ─────────────────────────────────────────────────────
/** localStorageからlocaleを初期値として読む（SSR安全） */
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ja'
  try {
    const saved = localStorage.getItem('mooncycle_locale') as Locale | null
    if (saved && saved in translations) return saved
  } catch { /* ignore */ }
  return 'ja'
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  const changeLocale = useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem('mooncycle_locale', newLocale)
    } catch { /* ignore */ }
    setLocale(newLocale)
    if (typeof window !== 'undefined') window.location.reload()
  }, [])

  /** ドット記法キーで翻訳テキストを取得。{days}などのプレースホルダーを置換 */
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = translations[locale] as Record<string, any>
    let val = getNestedValue(dict, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(`{${k}}`, String(v))
      }
    }
    return val
  }, [locale])

  return { locale, changeLocale, t }
}

// ─── サーバーサイド / 非フック用 ─────────────────────────────────────────
export function getTranslations(locale: Locale) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = translations[locale] as Record<string, any>
  return (key: string, params?: Record<string, string | number>): string => {
    let val = getNestedValue(dict, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(`{${k}}`, String(v))
      }
    }
    return val
  }
}
