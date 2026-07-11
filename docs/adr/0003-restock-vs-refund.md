# 3. Restock vs Refund (Shrinkage)

Date: 2026-07-10

## Status

Accepted

## Context

When processing order returns or cancellations, administrators need to decide whether the returned physical fabric can be added back to the active inventory. Since fabric can be damaged in transit or cut by the customer, not all returned inventory is sellable.

## Decision

The system must differentiate between **Cancel & Restock** (inventory is incremented back to the store) and **Refund Only** (inventory is written off as shrinkage). 

## Consequences

- "Cancel & Restock" should generally be reserved for pre-shipment cancellations.
- "Refund Only" accommodates post-shipment returns of unsellable fabric.
- This ensures damaged fabric does not artificially inflate the digital `stock_quantity`, leading to false availability on the storefront.
