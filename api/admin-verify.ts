import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: Admin Password Verification
 *
 * Validates the admin password server-side so it never appears in the frontend bundle.
 *
 * Required Environment Variable in Vercel:
 *   ADMIN_PASSWORD – The admin password
 *
 * Endpoint: POST /api/admin-verify
 * Body: { "password": "..." }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
  }

  const { password } = req.body || {};

  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  return res.status(200).json({ success: true });
}
