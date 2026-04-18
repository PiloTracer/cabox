/** Canonical storefront path: /{locale}/{departmentSlug}/products/{productSlug} */
export function productDetailPath(
  locale: string,
  departmentSlug: string,
  productSlug: string,
): string {
  return `/${locale}/${departmentSlug}/products/${productSlug}`;
}

export function departmentHomePath(locale: string, departmentSlug: string): string {
  return `/${locale}/${departmentSlug}`;
}

export function departmentProductsPath(
  locale: string,
  departmentSlug: string,
  query?: { cat?: string; q?: string },
): string {
  const base = `/${locale}/${departmentSlug}/products`;
  if (!query?.cat && !query?.q) return base;
  const u = new URLSearchParams();
  if (query.cat) u.set('cat', query.cat);
  if (query.q) u.set('q', query.q);
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}
