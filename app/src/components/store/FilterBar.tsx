'use client';

import { useRouter, usePathname } from 'next/navigation';

interface Category {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
}

interface FilterBarProps {
  categories: Category[];
  activeCat?: string;
  locale: string;
}

export default function FilterBar({ categories, activeCat, locale }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (cat?: string) => {
    const url = cat ? `${pathname}?cat=${cat}` : pathname;
    router.push(url);
  };

  return (
    <div className="filter-bar">
      <button
        className={`filter-chip ${!activeCat ? 'active' : ''}`}
        onClick={() => navigate()}
      >
        Todos
      </button>
      {categories.map((c) => (
        <button
          key={c.slug}
          className={`filter-chip ${activeCat === c.slug ? 'active' : ''}`}
          onClick={() => navigate(c.slug)}
        >
          {locale === 'es' ? c.nameEs : c.nameEn}
        </button>
      ))}
    </div>
  );
}
