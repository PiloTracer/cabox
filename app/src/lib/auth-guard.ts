/**
 * lib/auth-guard.ts — Centralized admin authentication guard
 *
 * SINGLE SOURCE OF TRUTH for API route protection.
 * Always use requireAdmin() in admin API routes — never inline session checks.
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

/**
 * Verify the request has a valid admin session.
 * Returns null if authenticated, or a 401 NextResponse if not.
 *
 * @example
 * const unauthorized = await requireAdmin();
 * if (unauthorized) return unauthorized;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
