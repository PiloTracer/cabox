'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function PromotionActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) router.refresh();
    });
  };

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      disabled={pending}
      onClick={toggle}
    >
      {pending ? '…' : isActive ? 'Desactivar' : 'Activar'}
    </button>
  );
}
