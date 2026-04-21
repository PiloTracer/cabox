import { z } from 'zod';

export const shippingZoneSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  provinces: z.array(z.string()).min(1),
  baseRate: z.number().nonnegative(),
  perKgRate: z.number().nonnegative(),
  freeAbove: z.number().nonnegative().optional().nullable(),
});

export const shippingZonePatchSchema = shippingZoneSchema.partial();
