import { z } from 'zod';

export const promotionCreateSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING']),
  discountValue: z.number().nonnegative(),
  minOrderAmount: z.number().optional().nullable(),
  maxDiscount: z.number().optional().nullable(),
  applicableTo: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  categoryIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  stackable: z.boolean().default(false),
  bannerImageUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});

export const promotionPatchSchema = promotionCreateSchema.partial();
