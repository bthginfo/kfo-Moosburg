import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

/**
 * Vercel Serverless Function: Log Inquiry to Google Sheets
 *
 * Appends a new row to the "Anfragen" tab whenever a contact form submission comes in.
 * This runs IN ADDITION to the email (send-email.ts) – the frontend calls both endpoints.
 *
 * Required Environment Variables in Vercel:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – Service Account Email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – Service Account Private Key (PEM, with \n)
 *   GOOGLE_SHEET_ID               – The Google Sheet ID
 *
 * Sheet Tab expected:
 *   "Anfragen" – Columns: Zeitstempel | Name | Email | Telefon | Gefunden über | Seite/Interesse | Datum | Wedding Guide | Nachricht | DSGVO | Pakete | Preis
 *
 * Endpoint: POST /api/submit-inquiry
 */

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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  await auth.authorize();
  return auth;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    return res.status(500).json({
      error: "Server configuration incomplete",
      hint: "Set GOOGLE_SHEET_ID in Vercel Environment Variables",
    });
  }

  const { name, email, phone, foundVia, interests, date, weddingGuide, message, selectedPackages, estimatedTotal } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Format timestamp in German timezone
    const now = new Date();
    const timestamp = now.toLocaleString("de-AT", {
      timeZone: "Europe/Vienna",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const interestsText = Array.isArray(interests) ? interests.join(", ") : interests || "";

    // Build package summary text for the sheet
    // selectedPackages already contains both packages AND addons (from priceBreakdown.items)
    const pkgNames = Array.isArray(selectedPackages) ? selectedPackages.map((p: any) => `${p.name} (${p.price})`).join(", ") : "";
    const packageSummary = pkgNames;
    const priceSummary = estimatedTotal || "";

    // Append row to "Anfragen" tab
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "'Anfragen'!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            timestamp,
            name,
            email,
            phone || "",
            foundVia || "",
            interestsText,
            date || "",
            weddingGuide ? "Ja" : "Nein",
            message || "",
            "Ja", // DSGVO consent (they can't submit without it)
            packageSummary,
            priceSummary,
          ],
        ],
      },
    });

    return res.status(200).json({ success: true, message: "Inquiry logged to Google Sheets" });
  } catch (error: any) {
    console.error("Google Sheets API Error:", error?.message || error);
    // Don't fail the whole submission – the email is more important
    return res.status(200).json({
      success: false,
      warning: "Failed to log to Google Sheets, but email may still have been sent",
      details: error?.message,
    });
  }
}