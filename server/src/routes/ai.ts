import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth.js";

export const ai = Router();

// Tells the front end whether to show the "Write with AI" button.
ai.get("/status", (_req, res) => {
  res.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
});

// Seller: generate a product description from a name and a few notes.
ai.post("/describe", requireAdmin, async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured" });

  const parsed = z
    .object({ name: z.string().min(1).max(200), notes: z.string().max(500).default("") })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content:
            `Write a punchy product description (2-3 sentences, under 60 words) for an online store.\n` +
            `Product: ${parsed.data.name}\nNotes from the seller: ${parsed.data.notes || "none"}\n` +
            `Return only the description text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("AI error", response.status, await response.text());
    return res.status(502).json({ error: "AI request failed" });
  }
  const data = (await response.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.find((c) => c.type === "text")?.text?.trim() ?? "";
  res.json({ description: text });
});
