import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/coupons/apply
 *
 * Body: { code, subtotal }
 * Returns: { discount, discountType, discountValue, couponId }
 */
export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json() as { code?: string; subtotal?: number };

  if (!code || typeof subtotal !== 'number') {
    return NextResponse.json({ message: 'code y subtotal son requeridos.' }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  const now = new Date();

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ message: 'Cupón inválido o expirado.' }, { status: 422 });
  }
  if (now < coupon.startsAt || now > coupon.expiresAt) {
    return NextResponse.json({ message: 'Este cupón no está activo en este momento.' }, { status: 422 });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ message: 'Este cupón ha alcanzado el límite de usos.' }, { status: 422 });
  }
  if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
    return NextResponse.json({
      message: `Pedido mínimo para este cupón: ₡${Number(coupon.minOrderAmount).toLocaleString('es-CR')}.`,
    }, { status: 422 });
  }

  // Calculate discount amount
  let discount = 0;
  const value  = Number(coupon.discountValue);

  if (coupon.type === 'PERCENTAGE') {
    discount = subtotal * (value / 100);
    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === 'FIXED_AMOUNT') {
    discount = Math.min(value, subtotal);
  } else if (coupon.type === 'FREE_SHIPPING') {
    // Signal to checkout — UI will set shippingCost = 0
    discount = 0;
  }

  return NextResponse.json({
    couponId:      coupon.id,
    code:          coupon.code,
    type:          coupon.type,
    discountValue: value,
    discount:      Math.round(discount),
    isFreeShipping: coupon.type === 'FREE_SHIPPING',
  });
}
