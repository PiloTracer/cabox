import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/shipping';

// POST /api/shipping/calculate
// Body: { subtotal, weightGrams, province }
export async function POST(req: NextRequest) {
  const body = await req.json() as { subtotal?: number; weightGrams?: number; province?: string };

  if (typeof body.subtotal !== 'number' || typeof body.province !== 'string') {
    return NextResponse.json({ message: 'subtotal y province son requeridos.' }, { status: 400 });
  }

  const result = await calculateShipping({
    subtotal:    body.subtotal,
    weightGrams: body.weightGrams ?? 0,
    province:    body.province,
  });

  return NextResponse.json(result);
}
