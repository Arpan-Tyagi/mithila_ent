# 4. Many-to-Many Collections vs Categories

Date: 2026-07-10

## Status

Accepted

## Context

We need to categorize products for navigation and discovery. A simple hierarchy dictates that a product belongs to exactly one Category (e.g. "Silk"). However, marketing needs require grouping products into curated, thematic lists (e.g. "Festive Collection", "Summer Edit") that span multiple categories.

## Decision

We will implement a true **many-to-many Collections** architecture alongside the strict 1-to-1 Category taxonomy. 
- **Categories**: Strict structural hierarchy (a product has exactly one `category_id`).
- **Collections**: Curated thematic groups (a product can belong to many collections via a `product_collections` join table).

## Consequences

- The database schema must be expanded to include a `collections` table and a `product_collections` join table.
- The Admin Dashboard will require new UI to create Collections and assign products to them.
- The storefront navigation can use Collections to build dynamic landing pages for specific marketing campaigns.
