/**
 * Types + helpers for POST /api/cart/validate (store checkout).
 */

export type CartValidateLine = {
  productId: string;
  variantSku?: string | null;
  quantity: number;
  price: number;
};

export type CartValidateResponseLine = CartValidateLine & {
  currentPrice?: number;
  priceChanged?: boolean;
  inStock?: boolean;
  valid: boolean;
  error: string | null;
};

export type CartValidateResponse = {
  valid: boolean;
  items: CartValidateResponseLine[];
};

export async function fetchCartValidation(items: CartValidateLine[]): Promise<CartValidateResponse> {
  const res = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error('No se pudo validar el carrito.');
  }
  return res.json();
}

/** Build payload from zustand cart lines */
export function cartItemsToValidatePayload(
  items: { id: string; variantId?: string; quantity: number; price: number }[],
): CartValidateLine[] {
  return items.map((i) => ({
    productId: i.id,
    variantSku: i.variantId ?? null,
    quantity: i.quantity,
    price: i.price,
  }));
}
