import express from "express";
import cors from "cors";
import "dotenv/config";
import { products } from "./routes/products.js";
import { orders } from "./routes/orders.js";
import { ai } from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/products", products);
app.use("/api/orders", orders);
app.use("/api/ai", ai);

// Catch-all error handler so a failed query returns JSON instead of crashing.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
