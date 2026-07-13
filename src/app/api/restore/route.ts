import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email: string }

    if (!email) {
      return Response.json({ found: false, message: 'メールアドレスを入力してください' })
    }

    // Stripe でメールアドレスからカスタマーを検索
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
      return Response.json({ found: false, message: 'このメールアドレスでの購入が見つかりません' })
    }

    const customer = customers.data[0]

    // アクティブなサブスクリプションを検索
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return Response.json({ found: false, message: 'アクティブなプランが見つかりません。既にキャンセル済みの可能性があります。' })
    }

    const sub     = subscriptions.data[0]
  const priceId = sub.items.data[0].price.id

  const plan =
    priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID
      ? 'premium'
      : 'lite'

  // current_period_end は Stripe SDK のバージョンによって型定義が異なるため as any でアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd  = (sub as any).current_period_end as number | undefined
  const validUntil = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // fallback: 30日後

    return Response.json({ found: true, plan, validUntil })
  } catch (err) {
    console.error('[/api/restore] error:', err)
    return Response.json(
      { found: false, message: '復元中にエラーが発生しました。しばらくしてから再試行してください。' },
      { status: 500 },
    )
  }
}
