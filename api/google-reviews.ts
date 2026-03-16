import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

/**
 * Vercel Serverless Function: Reviews from Google Sheet
 *
 * Reads reviews from the "Reviews" tab in Mario's Google Sheet.
 * Mario can add/edit/remove reviews directly in the spreadsheet.
 *
 * Required Environment Variables in Vercel:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – Service Account Email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – Service Account Private Key (PEM)
 *   GOOGLE_SHEET_ID               – The Google Sheet ID
 *
 * Sheet Tab: "Reviews"
 *   Column A: Autor
 *   Column B: Review_DE
 *   Column C: Review_EN
 *
 * Endpoint: GET /api/google-reviews
 * Cache: 5 minutes via Vercel CDN (s-maxage=300), stale-while-revalidate 1 hour
 */

export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  textEn: string;
}

export interface ReviewsResponse {
  reviews: ReviewData[];
  averageRating: number;
  totalReviews: number;
  fetchedAt: string;
  source: "sheets" | "fallback";
}

// ── Auth helper (same as other endpoints) ──
async function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !key) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY");
  }

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

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "'Reviews'!A:C",
    });

    const rows = result.data.values as string[][] | undefined;

    const reviews: ReviewData[] = [];

    if (rows && rows.length > 1) {
      // Skip header row
      for (const row of rows.slice(1)) {
        const author = row[0]?.trim();
        const textDe = row[1]?.trim();
        const textEn = row[2]?.trim();

        if (!author || !textDe) continue;

        reviews.push({
          author,
          rating: 5, // All reviews from Mario's curated list are 5 stars
          text: textDe,
          textEn: textEn || textDe, // Fallback to DE if EN is empty
        });
      }
    }

    const payload: ReviewsResponse = {
      reviews,
      averageRating: 5,
      totalReviews: reviews.length,
      fetchedAt: new Date().toISOString(),
      source: "sheets",
    };

    // Cache for 5 minutes, stale-while-revalidate 1 hour
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    res.setHeader("Content-Type", "application/json");

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error("Google Sheets Reviews Error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to fetch reviews from Google Sheets",
      details: error?.message,
    });
  }
}
