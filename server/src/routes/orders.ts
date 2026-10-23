import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../auth.js";

export const orders = Router();

const CheckoutInput = z.object({
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email(),
  items: z
    .array(z.object({ product_id: z.number().int(), quantity: z.number().int().min(1).max(99) }))
    .min(1),
});

// Public: place an order.
// Runs in a database transaction: stock checks, stock updates and the order
// insert either all succeed or all roll back, so stock can never go negative.
orders.post("/", async (req, res) => {
  const parsed = CheckoutInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customer_name, customer_email, items } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let total = 0;
    const priced: { product_id: number; quantity: number; price_pence: number }[] = [];

    for (const item of items) {
      // FOR UPDATE locks the row so two shoppers can't buy the last item at once.
      const { rows } = await client.query(
        "SELECT price_pence, stock, name FROM products WHERE id = $1 FOR UPDATE",
        [item.product_id]
      );
      const product = rows[0];
      if (!product) throw new HttpError(400, `Product ${item.product_id} not found`);
      if (product.stock < item.quantity) throw new HttpError(409, `Not enough stock for ${product.name}`);

      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id]);
      total += product.price_pence * item.quantity;
      priced.push({ ...item, price_pence: product.price_pence });
    }

    const { rows } = await client.query(
      "INSERT INTO orders (customer_name, customer_email, total_pence) VALUES ($1, $2, $3) RETURNING *",
      [customer_name, customer_email, total]
    );
    const order = rows[0];
    for (const p of priced) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_pence) VALUES ($1, $2, $3, $4)",
        [order.id, p.product_id, p.quantity, p.price_pence]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  } finally {
    client.release();
  }
});

// Seller: list orders with their items
orders.get("/", requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*,
      COALESCE(json_agg(json_build_object(
        'product_id', oi.product_id, 'name', p.name,
        'quantity', oi.quantity, 'price_pence', oi.price_pence
      )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    GROUP BY o.id
    ORDER BY o.created_at DESC`);
  res.json(rows);
});

// Seller: change status
orders.patch("/:id", requireAdmin, async (req, res) => {
  const parsed = z.object({ status: z.enum(["pending", "shipped", "cancelled"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { rows } = await pool.query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING *", [
    parsed.data.status,
    req.params.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
