/** Shared Spanish labels & badge styles for admin order/payment UI */

export const ADMIN_ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'En proceso',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const ADMIN_PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Pagado',
  FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
};

export const ADMIN_ORDER_STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  PROCESSING: 'new',
  SHIPPED: 'new',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export const ADMIN_PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'muted',
};
