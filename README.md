# Mithila Enterprises

A premium e-commerce platform for Madhubani heritage fabrics, featuring AI-generated product variants and a high-performance modern web architecture.

## Overview
Mithila Enterprises brings the geometric perfection of Madhubani art to the world of premium cotton and linen fabrics. This project is a robust, full-stack Next.js storefront equipped with dynamic mock data and aesthetic UI patterns.

## Tech Stack & Architecture
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS, Vanilla CSS (`globals.css`), and Framer Motion for smooth micro-animations.
- **State Management**: Zustand (with persistent storage for Cart state)
- **Database/Backend**: Currently utilizing a robust mock data layer (`src/lib/mockData.ts`) to simulate a Supabase backend for immediate local testing.
- **Icons & Components**: Lucide React and custom accessible UI components.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) to browse the store.

## Key Features
- **Dynamic Catalog**: Browse through Categories (Cotton, Linen, Blends) and Shop All.
- **Mock Database Integration**: Pre-populated with 10 high-quality AI-generated product variants (Sarees, Dupattas, Totes, Wall Art, etc.).
- **Interactive Cart**: Persistent slide-out cart drawer with animated Framer Motion transitions.
- **Admin Dashboard**: Simulated admin portal to view orders, inventory, and promotions.
- **Future-Proof**: Upgraded to support Next.js 15+ asynchronous route `params` and `searchParams` conventions.

## Project Structure
- `src/app/`: Next.js App Router pages (Home, Shop, Product, Admin, Account, etc.)
- `src/components/`: Reusable React components (Header, Footer, CartDrawer, ProductCard)
- `src/lib/`: Utilities and mock data service.
- `src/store/`: Zustand state definitions.
- `public/`: Static assets, including generated product images and Madhubani vector patterns.
