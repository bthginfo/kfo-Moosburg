import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

/**
 * Vercel Serverless Function: Read Gallery Images from Google Sheets
 *
 * Reads image data from the "Bilder" tab so Mario can manage all gallery
 * images across all pages directly in the spreadsheet.
 *
 * Required Environment Variables in Vercel:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – Service Account Email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – Service Account Private Key (PEM, with \n)
 *   GOOGLE_SHEET_ID               – The Google Sheet ID
 *
 * Sheet Tab expected:
 *   "Bilder" – Columns: Seite | Kategorie | Bild-URL | Alt_DE | Alt_EN
 *
 * "Seite" values: Hochzeit, Tiere, Portrait, Home
 * "Kategorie" values for Hochzeit: standesamt, getting-ready, paarshooting, freie-trauung, kirchliche-trauung, party
 * "Kategorie" values for others: gallery (or custom categories)
 *
 * Endpoint: GET /api/get-images
 * Cache: 5 minutes via Vercel CDN (s-maxage=300), stale-while-revalidate 1 hour
 */

// ── Types ──
export interface ImageEntry {
  page: string;
  category: string;
  src: string;
  altDe: string;
  altEn: string;
}

export interface ImagesResponse {
  images: ImageEntry[];
  fetchedAt: string;
  source: "sheets" | "fallback";
}

// ── Auth helper ──
async function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !key) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY");
  }

  // Robust key parsing: handles both single-line (literal \n) and multi-line (real newlines)
  let privateKey = key;
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  await auth.authorize();
  return auth;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    return res.status(500).json({
      error: "Server configuration incomplete",
      hint: "Set GOOGLE_SHEET_ID in Vercel Environment Variables",
    });
  }

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Bilder'!A:E",
    });

    const rows = response.data.values as string[][] | undefined;
    const images: ImageEntry[] = [];

    if (rows && rows.length > 1) {
      // Skip header row
      for (const row of rows.slice(1)) {
        const page = (row[0] || "").trim().toLowerCase();
        const category = (row[1] || "").trim().toLowerCase();
        const src = (row[2] || "").trim();
        const altDe = (row[3] || "").trim();
        const altEn = (row[4] || "").trim();

        // Skip empty rows or rows without a URL
        if (!src || !page) continue;

        images.push({ page, category, src, altDe, altEn });
      }
    }

    const payload: ImagesResponse = {
      images,
      fetchedAt: new Date().toISOString(),
      source: "sheets",
    };

    // Cache for 5 minutes, stale-while-revalidate 1 hour
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error("Google Sheets API Error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to fetch images from Google Sheets",
      details: error?.message,
    });
  }
}