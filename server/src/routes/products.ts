import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../auth.js";

export const products = Router();

// zod validates request bodies so bad input never reaches the database.
const ProductInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  price_pence: z.number().int().min(0),
  stock: z.number().int().min(0),
  image_url: z.string().url().or(z.literal("")).default(""),
});

// Public: list all products
products.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(rows);
});

// Public: one product
products.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// Seller: create
products.post("/", requireAdmin, async (req, res) => {
  const parsed = ProductInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, price_pence, stock, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [p.name, p.description, p.price_pence, p.stock, p.image_url]
  );
  res.status(201).json(rows[0]);
});

// Seller: update
products.put("/:id", requireAdmin, async (req, res) => {
  const parsed = ProductInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;
  const { rows } = await pool.query(
    `UPDATE products SET name=$1, description=$2, price_pence=$3, stock=$4, image_url=$5
     WHERE id=$6 RETURNING *`,
    [p.name, p.description, p.price_pence, p.stock, p.image_url, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// Seller: delete (blocked if the product already appears in an order)
products.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch {
    res.status(409).json({ error: "This product has orders, so it can't be deleted. Set stock to 0 instead." });
  }
});
