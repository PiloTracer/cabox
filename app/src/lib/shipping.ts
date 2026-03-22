/**
 * lib/shipping.ts
 *
 * Centralized shipping cost calculation.
 * Single source of truth — used by both /api/shipping/calculate and the checkout form.
 *
 * Rules (Costa Rica internal delivery):
 *  1. If order subtotal >= zone.freeAbove → free shipping
 *  2. Otherwise: baseRate + (weightKg * perKgRate), minimum = baseRate
 *  3. Default zone used when province not found in any zone
 */

import { prisma } from '@/lib/prisma';

export interface ShippingInput {
  subtotal:    number;   // CRC amount before shipping
  weightGrams: number;   // total cart weight in grams
  province:    string;   // Costa Rica province name
}

export interface ShippingResult {
  cost:     number;
  zoneName: string;
  isFree:   boolean;
}

// Fallback hardcoded rates (used if no ShippingZone rows exist yet)
const DEFAULT_BASE_RATE     = 3_500;  // CRC
const DEFAULT_PER_KG_RATE   = 500;   // CRC per kg
const DEFAULT_FREE_THRESHOLD = 75_000; // CRC

export async function calculateShipping(input: ShippingInput): Promise<ShippingResult> {
  const { subtotal, weightGrams, province } = input;
  const weightKg = weightGrams / 1000;

  // Find matching zone
  const zones = await prisma.shippingZone.findMany();
  const zone  = zones.find((z) =>
    z.provinces.some((p) => p.toLowerCase() === province.toLowerCase())
  );

  if (zone) {
    const freeAbove = zone.freeAbove ? Number(zone.freeAbove) : null;
    if (freeAbove !== null && subtotal >= freeAbove) {
      return { cost: 0, zoneName: zone.nameEs, isFree: true };
    }
    const cost = Number(zone.baseRate) + weightKg * Number(zone.perKgRate);
    return { cost: Math.max(cost, Number(zone.baseRate)), zoneName: zone.nameEs, isFree: false };
  }

  // Fallback rates
  if (subtotal >= DEFAULT_FREE_THRESHOLD) {
    return { cost: 0, zoneName: 'Zona estándar', isFree: true };
  }
  const cost = DEFAULT_BASE_RATE + weightKg * DEFAULT_PER_KG_RATE;
  return { cost: Math.max(cost, DEFAULT_BASE_RATE), zoneName: 'Zona estándar', isFree: false };
}
