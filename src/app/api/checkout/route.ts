import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

export async function POST(req: Request) {
  try {
    const { priceId, plan } = (await req.json()) as {
      priceId: string
      plan: string
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/premium/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/premium`,
      locale: 'ja',
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout] error:', err)
    return Response.json({ error: 'チェックアウトセッションの作成に失敗しました' }, { status: 500 })
  }
}
