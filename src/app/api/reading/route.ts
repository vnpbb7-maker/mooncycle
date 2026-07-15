import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

type BaziInfo = {
  dayKan: string
  dayMasterName: string
  wuxingCount: { wood: number; fire: number; earth: number; metal: number; water: number }
} | null

export async function POST(req: Request) {
  try {
    const {
      cards, positions, spreadName, moonPhase, moonSign,
      extraHint, locale, bazi, question,
    } = await req.json() as {
      cards:       { name: string; keyword: string }[]
      positions:   string[]
      spreadName:  string
      moonPhase:   string
      moonSign:    string
      extraHint?:  string
      locale?:     string
      bazi?:       BaziInfo
      question?:   string
    }

    const isZh = locale === 'zh-TW'
    const isThreeCard = cards.length === 3

    // ── 命式コンテキスト ─────────────────────────────────────────────────────
    const baziContext: string = bazi
      ? isZh
        ? `\n\n【用戶命盤資訊】\n日主：${bazi.dayKan}（${bazi.dayMasterName}）\n五行：木${bazi.wuxingCount.wood} 火${bazi.wuxingCount.fire} 土${bazi.wuxingCount.earth} 金${bazi.wuxingCount.metal} 水${bazi.wuxingCount.water}\n2026年流年：丙午年\n\n請在解讀牌卡時，將用戶的日主特質融入分析：\n- 日主的五行屬性影響牌卡的解讀角度\n- 用神（最少的五行）方向的牌卡對此人特別重要\n- 以日主的性格特質（${bazi.dayMasterName}）來詮釋牌卡的具體建議`
        : `\n\n【命式情報】\n日主：${bazi.dayKan}（${bazi.dayMasterName}）\n五行：木${bazi.wuxingCount.wood} 火${bazi.wuxingCount.fire} 土${bazi.wuxingCount.earth} 金${bazi.wuxingCount.metal} 水${bazi.wuxingCount.water}\n2026年流年：丙午年\n\nカードを読む際、必ず命式を考慮してください：\n- 日主の五行の性質でカードの意味を色づける\n- 用神（最も少ない五行）方向のカードを特に重視\n- 日主の本質（${bazi.dayMasterName}）の視点から具体的アドバイスを`
      : ''

    // ── 3枚引き専用ユーザープロンプト ─────────────────────────────────────
    const threeCardUserPrompt = isZh
      ? `${question ? `【占卜問題】${question}\n\n` : ''}【抽出的牌】
過去：${cards[0]?.name}（${cards[0]?.keyword}）
現在：${cards[1]?.name}（${cards[1]?.keyword}）
未來：${cards[2]?.name}（${cards[2]?.keyword}）

【月相資訊】${moonPhase} ／ 月亮星座：${moonSign}
${bazi ? `【命盤】日主：${bazi.dayKan}（${bazi.dayMasterName}）` : ''}
${extraHint ? `\n${extraHint}` : ''}`
      : `${question ? `【占いたいこと】${question}\n\n` : ''}【引いたカード】
過去：${cards[0]?.name}（${cards[0]?.keyword}）
現在：${cards[1]?.name}（${cards[1]?.keyword}）
未来：${cards[2]?.name}（${cards[2]?.keyword}）

【月相】${moonPhase} ／ 月星座：${moonSign}
${bazi ? `【命式】日主：${bazi.dayKan}（${bazi.dayMasterName}）` : ''}
${extraHint ? `\n${extraHint}` : ''}`

    // ── 3枚引き専用システムプロンプト ─────────────────────────────────────
    const threeCardSystemPrompt = (isZh
      ? `你是雷諾曼牌的專家占卜師。請完全用繁體中文進行深度解讀。

請不要逐張單獨解說，以「組合」方式讀出完整訊息。將三張牌串連成一個完整故事。

必須按照以下結構：

## 整體流向
三張牌合起來說的故事是什麼？（過去發生了什麼→現在的狀態→未來的走向）150字左右。

## 關鍵組合解讀
・**過去×現在**（${cards[0]?.name}×${cards[1]?.name}）：這個組合揭示了什麼隱藏的動態？
・**現在×未來**（${cards[1]?.name}×${cards[2]?.name}）：接下來最重要的轉折點是什麼？
・**過去×未來**（${cards[0]?.name}×${cards[2]?.name}）：貫穿這段旅程的核心主題是什麼？

## 給你的訊息
${question ? `針對「${question}」這個問題，` : ''}結合月相（${moonPhase}・${moonSign}）的能量，給出具體可行的建議。用溫暖但直接的語氣，100字左右。`

      : `あなたはルノルマンカードの専門占い師です。日本語で深いリーディングを行ってください。

カードを1枚ずつ個別に解説せず、必ず「組み合わせ」で読んでください。3枚を1つのストーリーとして繋げます。

必ず以下の構成で：

## 全体の流れ
3枚が語るストーリーは何か？（過去に何があった→現在の状態→未来の方向性）150字程度。

## 重要な組み合わせ読み
・**過去×現在**（${cards[0]?.name}×${cards[1]?.name}）：この組み合わせが示す隠れた動きは？
・**現在×未来**（${cards[1]?.name}×${cards[2]?.name}）：次の転換点となる鍵は？
・**過去×未来**（${cards[0]?.name}×${cards[2]?.name}）：この旅を貫くテーマは？

## あなたへのメッセージ
${question ? `「${question}」という問いに対して、` : ''}月相（${moonPhase}・${moonSign}）のエネルギーも踏まえて、具体的で実践的なアドバイスを。温かく、でも率直なトーンで100字程度。`) + baziContext

    // ── 通常システムプロンプト ───────────────────────────────────────────
    const systemPrompt = (isZh
      ? `你是雷諾曼牌和月亮能量的專家。請完全用繁體中文提供解讀。
必須按照以下結構，確保每個部分都寫完整：

## 整體訊息
整體的核心訊息（150字）

## 各牌解說
每張牌以【位置：牌名】格式，用具體易懂的語言解說（每張3-4句）
避免艱澀術語，用日常語言溫暖地傳達。請適當加入表情符號。

## 今日的你
結語訊息，給予今日最重要的提示（100字）

請用溫暖、具體的語言，給讀者帶來啟發與勇氣。`
      : `あなたはルノルマンカードの専門家です。
必ず最後まで完結した文章でリーディングを提供してください。
途中で切れることなく、締めくくりの言葉まで書き切ってください。
日本語で、以下の3部構成で提供してください：

## 総合メッセージ
詩的で深みのある全体的なメッセージ（150字程度）

## カード別の解説
各カードを【ポジション名：カード名】の形式で、
一般の人にもわかりやすく具体的に解説してください。
占い用語を避け、日常の言葉で語りかけるように書いてください。
絵文字を適度に使って読みやすくしてください。
各カードの解説は3〜4文で完結させてください。

## 今日のあなたへ
全体をまとめる締めくくりのメッセージ（100字程度）`) + baziContext

    // ── 通常ユーザープロンプト ─────────────────────────────────────────────
    const userPrompt = isZh
      ? `牌陣：${spreadName}
月相：${moonPhase} ／ 月亮星座：${moonSign}
${question ? `\n占卜問題：${question}` : ''}

抽到的牌：
${cards.map((c, i) =>
  `${positions[i] ?? `第${i + 1}張`}：${c.name}（${c.keyword}）`
).join('\n')}
${extraHint ? `\n${extraHint}` : ''}

請根據以上牌卡組合進行完整解讀。
※ 除了抽象表達，也請包含具體建議與行動提示。`
      : `スプレッド: ${spreadName}
月相: ${moonPhase} / 月星座: ${moonSign}
${question ? `\n占いたいこと: ${question}` : ''}

引いたカード:
${cards.map((c, i) =>
  `${positions[i] ?? `カード${i + 1}`}: ${c.name}（${c.keyword}）`
).join('\n')}
${extraHint ? `\n${extraHint}` : ''}

このカードの組み合わせから総合リーディングをお願いします。
※ 抽象的な表現だけでなく、具体的なアドバイスや行動のヒントも含めてください。`

    // ── 最終プロンプト選択 ────────────────────────────────────────────────
    const finalSystem     = isThreeCard ? threeCardSystemPrompt : systemPrompt
    const finalUserPrompt = isThreeCard ? threeCardUserPrompt   : userPrompt

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: finalSystem,
      messages: [{ role: 'user', content: finalUserPrompt }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[/api/reading] error:', err)
    return new Response('リーディングの生成に失敗しました', { status: 500 })
  }
}
