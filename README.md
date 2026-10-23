# Mini Store

A small full-stack storefront: sellers list products and manage orders, shoppers browse, add to a cart and check out. Includes an AI button that writes product descriptions.

**Live demo:** [add your link] · **Stack:** React, TypeScript, Node/Express, PostgreSQL

## Features

- Public store page with cart (saved across refreshes) and checkout
- Seller dashboard: add, edit and delete products, view orders, change order status, see revenue
- Checkout runs in a database transaction with row locking, so two shoppers can't buy the last item at the same time and stock never goes negative
- Prices stored as integers (pence) to avoid rounding errors; order items keep the price paid, so later price changes don't rewrite history
- Input validated with zod on every endpoint
- "Write with AI" generates product descriptions via the Claude API (optional)

## Project structure

```
server/            Express + TypeScript API
  db/schema.sql    Tables: products, orders, order_items
  src/routes/      products.ts, orders.ts, ai.ts
web/               React + TypeScript front end (Vite)
  src/pages/       StorePage, CartPage, AdminPage
  src/api.ts       Typed API client
  src/cart.tsx     Cart state (React context)
```

## Run it locally

You need Node 20+ and Docker (for Postgres). No Docker? Create a free Postgres database on [Neon](https://neon.tech) and use its connection string instead.

```bash
# 1. Start Postgres
docker compose up -d

# 2. API
cd server
cp .env.example .env        # set ADMIN_TOKEN to any password you like
npm install
npm run db:init             # creates tables + sample products
npm run dev                 # http://localhost:4000

# 3. Front end (new terminal)
cd web
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173. The Seller page asks for the `ADMIN_TOKEN` you set.

To turn on the AI button, add your `ANTHROPIC_API_KEY` to `server/.env` and restart the API.

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /api/products | – | List products |
| GET | /api/products/:id | – | One product |
| POST | /api/products | admin | Create product |
| PUT | /api/products/:id | admin | Update product |
| DELETE | /api/products/:id | admin | Delete product (blocked if it has orders) |
| POST | /api/orders | – | Checkout |
| GET | /api/orders | admin | List orders with items |
| PATCH | /api/orders/:id | admin | Change status |
| GET | /api/ai/status | – | Is AI configured? |
| POST | /api/ai/describe | admin | Generate a description |

Admin routes need the `x-admin-token` header.

## Deploy (free tiers)

1. **Database: Neon.** Create a project, copy the connection string.
2. **API: Render.** New Web Service from your GitHub repo. Root directory `server`, build `npm install && npm run build`, start `npm start`. Add env vars `DATABASE_URL`, `ADMIN_TOKEN` and optionally `ANTHROPIC_API_KEY`. Then run `npm run db:init` once from Render's Shell tab.
3. **Front end: Netlify.** Base directory `web`, build `npm run build`, publish `web/dist`. Add env var `VITE_API_URL` = your Render API URL.

## What I'd build next

- Real seller accounts (sign-up, hashed passwords, sessions) instead of a shared token
- Stripe test-mode payments at checkout
- GraphQL API layer
- Image uploads to cloud storage
- Tests (Vitest for the API, Playwright for checkout)
- Order confirmation emails
