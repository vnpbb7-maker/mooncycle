import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      dayMaster: string
      dayMasterElement: string
      dayMasterName: string
      pillars: { label: string; kan: string; shi: string }[]
      bodyStrength: string
      yongShen: string
      jiShen: string
      wuxingCount: Record<string, number>
      yearFortune: { theme: string; tenGodKan: string }
      moonPhase: string
      locale?: string
    }

    const isZh = body.locale === 'zh-TW'

    const systemPrompt = isZh
      ? `你是四柱推命的專家。請完全用繁體中文，以溫暖且具體的語言解說命盤。
必須按照以下結構寫完整，400-600字：

## 你的本質
從日主與五行平衡看出的根本性格與優勢

## 才能與課題
命盤顯示的天賦才能，以及應該意識到的成長方向

## 2026年的運勢
流年${body.yearFortune?.tenGodKan ?? ''}的運氣與具體行動指引

## 與月亮能量的共鳴
當前月相（${body.moonPhase ?? ''}）的協同訊息

請用溫暖、易懂的語言，給讀者帶來啟發。`
      : `あなたは四柱推命の専門家です。
命式から読み取れるその人の本質・才能・課題・2026年の運勢を、
温かく具体的な言葉で解説してください。
占い用語は使いつつも、初心者にもわかるよう説明を添えてください。
400〜600字程度で、以下の構成で書いてください：

## あなたの本質
日主と五行バランスから見えるその人の根本的な性質・強み

## 才能と課題
命式が示す天賦の才能と、意識すべき成長ポイント

## 2026年の流れ
流年${body.yearFortune?.tenGodKan ?? ''}の運気と具体的な行動指針

## 月のエネルギーとの共鳴
今の月相（${body.moonPhase ?? ''}）とのシナジーメッセージ`

    const elemJa: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
    const elemZh: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
    const elemMap = isZh ? elemZh : elemJa
    const wuxingStr = Object.entries(body.wuxingCount ?? {})
      .map(([k, v]) => `${elemMap[k] ?? k}:${v}`).join(' / ')

    const userPrompt = isZh
      ? `【命盤資訊】
日主：${body.dayMaster ?? ''}（${body.dayMasterElement ?? ''}・${body.dayMasterName ?? ''}）
身強弱：${body.bodyStrength ?? ''}
用神：${body.yongShen ?? ''} ／ 忌神：${body.jiShen ?? ''}
五行平衡：${wuxingStr}
四柱：${(body.pillars ?? []).map(p => `${p.label}${p.kan}${p.shi}`).join(' ')}
2026年流年十神：${body.yearFortune?.tenGodKan ?? ''}
當前月相：${body.moonPhase ?? ''}

請根據以上命盤進行完整的綜合解讀。`
      : `【命式情報】
日主: ${body.dayMaster ?? ''}（${body.dayMasterElement ?? ''}・${body.dayMasterName ?? ''}）
身強弱: ${body.bodyStrength ?? ''}
用神: ${body.yongShen ?? ''} / 忌神: ${body.jiShen ?? ''}
五行バランス: ${wuxingStr}
四柱: ${(body.pillars ?? []).map(p => `${p.label}${p.kan}${p.shi}`).join(' ')}
2026年流年十神: ${body.yearFortune?.tenGodKan ?? ''}
今の月相: ${body.moonPhase ?? ''}

上記の命式をもとに、総合的な鑑定をお願いします。`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
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
    console.error('[/api/bazi-reading] error:', err)
    return new Response('命式リーディングの生成に失敗しました', { status: 500 })
  }
}
