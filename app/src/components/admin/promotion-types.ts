/** Serializable promotion for admin create/edit forms (client-safe JSON) */
export type PromotionFormInitial = {
  id: string;
  nameEs: string;
  nameEn: string;
  slug: string;
  type: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  applicableTo: string;
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  stackable: boolean;
  bannerImageUrl: string | null;
};
