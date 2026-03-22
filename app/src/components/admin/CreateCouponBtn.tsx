'use client';

import { useState } from 'react';
import CouponForm from './CouponForm';

export function CreateCouponBtn() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Nuevo Cupón</button>
      {open && <CouponForm onClose={() => setOpen(false)} />}
    </>
  );
}
