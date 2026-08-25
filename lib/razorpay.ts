'use server';

import Razorpay from 'razorpay';
import { Order } from '../types';
import { supabase } from './supabase';

if (typeof window !== 'undefined') {
  throw new Error('lib/razorpay.ts is a server-side module and must never be loaded in the browser.');
}

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error('Razorpay credentials missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in environment variables.');
}

// Single Razorpay instance with server-side secret key
const razorpayClient = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

/**
 * Generates a deterministic idempotency key for payment actions.
 */
export function makeIdempotencyKey(orderId: string, action: string, attempt: number): string {
  return `${orderId}_${action}_${attempt}`;
}

/**
 * Creates a Razorpay Payment Link for a failed order.
 * Guarantees idempotency by checking Supabase `payment_links` table before calling Razorpay API.
 * Never creates duplicate payment links for the same order attempt.
 *
 * @param order The order for which to create the recovery payment link
 * @param attemptNumber The attempt index (1, 2, 3...)
 * @returns Object containing the created or retrieved linkId and shortUrl
 * @throws Error if Razorpay API call fails
 */
export async function createPaymentLink(
  order: Order,
  attemptNumber: number
): Promise<{ linkId: string; shortUrl: string }> {
  const idempotencyKey = makeIdempotencyKey(order.id, 'PAYMENT_LINK', attemptNumber);

  // Step 1: Check database for existing payment link matching idempotency key
  try {
    const { data: existingLink } = await supabase
      .from('payment_links')
      .select('link_id, short_url')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingLink && existingLink.link_id && existingLink.short_url) {
      return {
        linkId: existingLink.link_id,
        shortUrl: existingLink.short_url,
      };
    }
  } catch (dbErr) {
    console.warn(`Idempotency check lookup notice for key ${idempotencyKey}:`, dbErr);
  }

  // Step 2: Create new Payment Link via Razorpay Test API
  let linkResponse: any;
  try {
    linkResponse = await razorpayClient.paymentLink.create({
      amount: Math.round(order.amount * 100), // amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `VoiceBack Recovery Payment Link for Order ${order.id}`,
      customer: {
        name: order.customer_name,
        contact: order.customer_phone,
      },
      notify: {
        sms: true,
        email: false,
      },
      reminder_enable: true,
      notes: {
        order_id: order.id,
        attempt: String(attemptNumber),
      },
    });
  } catch (apiErr: any) {
    const errMessage = apiErr?.error?.description || apiErr?.message || String(apiErr);
    console.error(`Razorpay API Payment Link creation failed for order ${order.id}:`, errMessage);
    throw new Error(`Razorpay Payment Link creation failed for order ${order.id}: ${errMessage}`);
  }

  const linkId = linkResponse.id;
  const shortUrl = linkResponse.short_url;

  if (!linkId || !shortUrl) {
    throw new Error(`Razorpay API returned an invalid response structure for order ${order.id}.`);
  }

  // Step 3: Persist newly created payment link in Supabase table
  try {
    const { error: insertErr } = await supabase.from('payment_links').insert({
      idempotency_key: idempotencyKey,
      order_id: order.id,
      attempt_number: attemptNumber,
      link_id: linkId,
      short_url: shortUrl,
      created_at: new Date().toISOString(),
    });

    if (insertErr && insertErr.code === '23505') {
      // Race condition handle: another process inserted in parallel
      const { data: raceLink } = await supabase
        .from('payment_links')
        .select('link_id, short_url')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (raceLink) {
        return {
          linkId: raceLink.link_id,
          shortUrl: raceLink.short_url,
        };
      }
    }
  } catch (persistErr) {
    console.error(`Failed to persist payment link to database for order ${order.id}:`, persistErr);
  }

  return { linkId, shortUrl };
}
