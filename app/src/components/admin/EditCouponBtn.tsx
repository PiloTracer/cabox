'use client';

import { useState } from 'react';
import CouponForm from './CouponForm';
import type { CouponFormInitial } from './coupon-types';

export default function EditCouponBtn({ initial }: { initial: CouponFormInitial }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        Editar
      </button>
      {open && <CouponForm initial={initial} onClose={() => setOpen(false)} />}
    </>
  );
}
