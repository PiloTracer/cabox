'use client';

import { useState } from 'react';
import PromotionForm from './PromotionForm';

export function CreatePromotionBtn() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Nueva Promoción</button>
      {open && <PromotionForm onClose={() => setOpen(false)} />}
    </>
  );
}
