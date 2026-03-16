import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

/**
 * Vercel Serverless Function: Read Packages from Google Sheets
 *
 * Reads package/pricing data from a Google Sheet so Mario can update
 * packages directly in the spreadsheet without touching code.
 *
 * Required Environment Variables in Vercel:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – Service Account Email (e.g. mario-website@project.iam.gserviceaccount.com)
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – Service Account Private Key (the full PEM key, with \n line breaks)
 *   GOOGLE_SHEET_ID               – The Google Sheet ID (from the URL: docs.google.com/spreadsheets/d/{SHEET_ID}/edit)
 *
 * Sheet Tabs expected:
 *   "Hochzeit Foto"   – Columns: Name | Preis | Untertitel_DE | Untertitel_EN | Features_DE | Features_EN | Highlight
 *   "Hochzeit Video"  – Same columns
 *   "Hochzeit Addons" – Columns: Text_DE | Text_EN
 *   "Portrait"        – Same columns as Hochzeit Foto
 *   "Tiere"           – Same columns as Hochzeit Foto (optional)
 *
 * Features are separated by semicolons (;) in the spreadsheet cells.
 * Highlight column: "ja" = highlighted package, empty = normal.
 *
 * Endpoint: GET /api/get-packages
 * Cache: 5 minutes via Vercel CDN (s-maxage=300), stale-while-revalidate 1 hour
 */

// ── Types ──
interface PackageData {
  name: string;
  price: string;
  subtitle: string;
  subtitleEn: string;
  features: string[];
  featuresEn: string[];
  highlight: boolean;
}

interface AddOnData {
  textDe: string;
  textEn: string;
}

interface PackagesResponse {
  weddingPhoto: PackageData[];
  weddingVideo: PackageData[];
  weddingAddons: AddOnData[];
  portrait: PackageData[];
  animals: PackageData[];
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

// ── Parse a sheet tab into PackageData[] ──
// Split features by semicolon, " / " (with spaces), or newline (supports all common separators)
function splitFeatures(text: string): string[] {
  return text.split(/;| \/ |\n/).map(f => f.trim()).filter(Boolean);
}

function parsePackages(rows: string[][] | undefined): PackageData[] {
  if (!rows || rows.length < 2) return [];

  // Skip header row
  return rows.slice(1).filter(row => row[0]?.trim()).map((row) => ({
    name: row[0]?.trim() || "",
    price: row[1]?.trim() || "",
    subtitle: row[2]?.trim() || "",
    subtitleEn: row[3]?.trim() || "",
    features: splitFeatures(row[4] || ""),
    featuresEn: splitFeatures(row[5] || ""),
    highlight: (row[6] || "").toLowerCase().trim() === "ja",
  }));
}

// ── Parse add-ons ──
function parseAddons(rows: string[][] | undefined): AddOnData[] {
  if (!rows || rows.length < 2) return [];

  return rows.slice(1).filter(row => row[0]?.trim()).map((row) => ({
    textDe: row[0]?.trim() || "",
    textEn: row[1]?.trim() || "",
  }));
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

    // Fetch all tabs in parallel
    const [weddingPhotoRes, weddingVideoRes, weddingAddonsRes, portraitRes, animalsRes] =
      await Promise.all([
        sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "'Hochzeit Foto'!A:G",
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "'Hochzeit Video'!A:G",
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "'Hochzeit Addons'!A:B",
        }),
        sheets.spreadsheets.values
          .get({
            spreadsheetId: sheetId,
            range: "'Portrait'!A:G",
          })
          .catch(() => ({ data: { values: undefined } })), // Optional tab
        sheets.spreadsheets.values
          .get({
            spreadsheetId: sheetId,
            range: "'Tiere'!A:G",
          })
          .catch(() => ({ data: { values: undefined } })), // Optional tab
      ]);

    const payload: PackagesResponse = {
      weddingPhoto: parsePackages(weddingPhotoRes.data.values as string[][]),
      weddingVideo: parsePackages(weddingVideoRes.data.values as string[][]),
      weddingAddons: parseAddons(weddingAddonsRes.data.values as string[][]),
      portrait: parsePackages(portraitRes.data.values as string[][]),
      animals: parsePackages(animalsRes.data.values as string[][]),
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
      error: "Failed to fetch packages from Google Sheets",
      details: error?.message,
    });
  }
}