// Pure, testable order-total math. Mirrors create_order_atomic so the checkout
// preview and the server-side order always agree.
// GST 2.0: woven/knitted fabrics (Ch. 50-60) are a flat 5%. Matches the
// COALESCE(p.gst_rate, 5.00) default in create_order_atomic (0040).
export const TAX_RATE = 0.05;
export const FLAT_SHIPPING = 50;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type DiscountInput = { type: string; amount: number } | null;

export function computeOrderTotals(
  subtotal: number,
  discount: DiscountInput = null,
  opts: { taxRate?: number; baseShipping?: number } = {}
) {
  const taxRate = opts.taxRate ?? TAX_RATE;
  const baseShipping = opts.baseShipping ?? FLAT_SHIPPING;
  const sub = round2(subtotal);
  const tax = round2(sub * taxRate);
  const isFreeShip = discount?.type === 'free_shipping';
  const shipping = sub > 0 ? (isFreeShip ? 0 : baseShipping) : 0;
  const discountReduction = discount ? (isFreeShip ? 0 : discount.amount) : 0;
  const total = Math.max(round2(sub + tax + shipping - discountReduction), 0);
  return { subtotal: sub, tax, shipping, discountReduction, total, isFreeShip };
}
