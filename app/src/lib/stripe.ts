/**
 * lib/stripe.ts — Centralized Stripe client singleton.
 * Never instantiate Stripe outside this file.
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // Graceful warning in dev when key not yet configured
  console.warn('[Stripe] STRIPE_SECRET_KEY not set — Stripe payments will be unavailable.');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;
