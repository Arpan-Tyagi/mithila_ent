# 2. Discount Stacking Math

Date: 2026-07-10

## Status

Accepted

## Context

We need to define how promotional coupon codes interact with products that are already marked down via direct product price overrides (e.g. during a site-wide sale). If a product's price is already reduced, can a user apply a 10% coupon code on top of it?

## Decision

We will allow **Discount Stacking**. Coupon codes are evaluated against the final cart subtotal. If a product enters the cart at a marked-down price, the coupon applies to that marked-down subtotal. 

## Consequences

- We avoid complex line-item-level discount tracking (e.g. tracking which items were "full price" vs "sale price" to selectively apply coupons).
- The math remains deterministic: `Final Price = (Sum of all items at their current cart price) - Coupon Discount`.
- Administrators must be careful when issuing deep coupon codes during site-wide sales, as users will receive double discounts.
