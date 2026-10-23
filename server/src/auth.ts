import type { NextFunction, Request, Response } from "express";

// Very simple seller auth: admin routes need the x-admin-token header.
// Good enough for a portfolio project; a real app would use proper user accounts.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || req.header("x-admin-token") !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
