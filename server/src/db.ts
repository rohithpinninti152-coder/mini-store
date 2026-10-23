import pg from "pg";
import "dotenv/config";

// One shared connection pool for the whole app.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Hosted Postgres (Neon, Render, Supabase) needs SSL; local Docker doesn't.
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});
