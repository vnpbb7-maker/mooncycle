import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

export async function POST(req: Request) {
  try {
    const { cards, positions, spreadName, moonPhase, moonSign, extraHint, locale } = await req.json() as {
      cards:      { name: string; keyword: string }[]
      positions:  string[]
      spreadName: string
      moonPhase:  string
      moonSign:   string
      extraHint?: string
      locale?:    string
    }

    const isZh = locale === 'zh-TW'

    const systemPrompt = isZh
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
全体をまとめる締めくくりのメッセージ（100字程度）`

    const userPrompt = isZh
      ? `牌陣：${spreadName}
月相：${moonPhase} ／ 月亮星座：${moonSign}

抽到的牌：
${cards.map((c, i) =>
  `${positions[i] ?? `第${i + 1}張`}：${c.name}（${c.keyword}）`
).join('\n')}
${extraHint ? `\n${extraHint}` : ''}

請根據以上牌卡組合進行完整解讀。
※ 除了抽象表達，也請包含具體建議與行動提示。`
      : `スプレッド: ${spreadName}
月相: ${moonPhase} / 月星座: ${moonSign}

引いたカード:
${cards.map((c, i) =>
  `${positions[i] ?? `カード${i + 1}`}: ${c.name}（${c.keyword}）`
).join('\n')}
${extraHint ? `\n${extraHint}` : ''}

このカードの組み合わせから総合リーディングをお願いします。
※ 抽象的な表現だけでなく、具体的なアドバイスや行動のヒントも含めてください。`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
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
