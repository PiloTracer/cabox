'use client';

import { useState } from 'react';
import PromotionForm from './PromotionForm';
import type { PromotionFormInitial } from './promotion-types';

export default function EditPromotionBtn({ initial }: { initial: PromotionFormInitial }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        Editar
      </button>
      {open && <PromotionForm initial={initial} onClose={() => setOpen(false)} />}
    </>
  );
}
