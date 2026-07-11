# 1. Partial Cancellations & Refund Math

Date: 2026-07-10

## Status

Accepted

## Context

We need to support partial cancellations where an individual line-item within an order is cancelled and refunded (e.g., due to a warehouse stockout or defect on a specific fabric roll), while the rest of the order proceeds. This introduces edge cases around non-item costs like shipping fees and cart-level discount thresholds.

## Decision

1. **Shipping Costs**: Sunk cost. We will not refund shipping costs on partial cancellations unless the *entire* order is cancelled. 
2. **Discounts**: Honored proportionately. If a cancelled item drops the subtotal below a coupon's minimum order value threshold, we will *not* claw back the discount on the remaining items. The discount applies proportionately to the remaining items based on their original subtotal share.

## Consequences

- The order state machine requires line-item level statuses (e.g. `order_items.status = 'cancelled'`).
- The refund calculation logic is drastically simplified, avoiding complex recalculations and angry customer support tickets.
