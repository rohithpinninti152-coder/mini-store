import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

// Creates the tables and adds a few sample products so the store isn't empty.
const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));

async function main() {
  await pool.query(readFileSync(schemaPath, "utf8"));

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM products");
  if (rows[0].n === 0) {
    await pool.query(
      `INSERT INTO products (name, description, price_pence, stock, image_url) VALUES
       ('Holographic sticker pack', 'Ten shiny holographic stickers.', 699, 50, 'https://picsum.photos/seed/holo/400/300'),
       ('Custom logo mug', 'Ceramic 11oz mug with your logo.', 1299, 20, 'https://picsum.photos/seed/mug/400/300'),
       ('Vinyl laptop decal', 'Weatherproof die-cut vinyl.', 499, 100, 'https://picsum.photos/seed/vinyl/400/300')`
    );
    console.log("Added sample products.");
  }
  console.log("Database ready.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
