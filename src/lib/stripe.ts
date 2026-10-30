import { loadStripe, type Stripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY

export const stripePromise: Promise<Stripe | null> =
  typeof publishableKey === 'string' && publishableKey.trim().length > 0
    ? loadStripe(publishableKey.trim())
    : Promise.resolve(null)
