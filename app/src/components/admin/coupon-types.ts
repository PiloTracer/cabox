export type CouponFormInitial = {
  id: string;
  code: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  type: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};
