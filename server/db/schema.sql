-- Products the seller lists in the store.
-- Prices are stored in pence (integers) to avoid floating-point rounding errors.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  price_pence INTEGER     NOT NULL CHECK (price_pence >= 0),
  stock       INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per checkout.
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  customer_name  TEXT        NOT NULL,
  customer_email TEXT        NOT NULL,
  total_pence    INTEGER     NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'shipped', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Line items. price_pence is copied at purchase time so later price
-- changes don't rewrite order history.
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  price_pence INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
