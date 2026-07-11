# 5. Payment Capture and Timeout Rules

Date: 2026-07-10

## Status

Accepted

## Context

When a customer initiates checkout via Razorpay, funds can either be auto-captured immediately or held via authorization until fulfillment. Additionally, some payment methods cause a delay between authorization and settlement, locking inventory in a pending state.

## Decision

1. **Auto-Capture**: We will configure Razorpay to automatically capture funds immediately upon successful checkout authorization. 
2. **Payment Timeout (1 Hour)**: Unpaid orders (where inventory has been hard-allocated but payment hasn't cleared) will automatically expire after 1 hour. Upon timeout, the order is cancelled and inventory is released back to the active pool.

## Consequences

- Cashflow is secured upfront, preventing fulfillment overhead on unauthorized funds.
- We minimize "phantom stockouts" caused by abandoned or delayed payment flows.
- A scheduled background cron job will be required to scan for 1-hour-old pending orders and execute the cancellation/restock logic.
