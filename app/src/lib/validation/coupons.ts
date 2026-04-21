import { z } from 'zod';

export const couponCreateSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  discountValue: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const couponPatchSchema = couponCreateSchema.partial();
