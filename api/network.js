/* ==========================================================================
   /api/network.js — Vercel serverless function (Node runtime)

   Real BCH network status (chain tip height, best block hash/time) from
   Haskoin Store, the primary BCH data source used across the CashCompass
   projects. Free, keyless, CORS-open.
   Docs: https://api.haskoin.com/bch
   ========================================================================== */

const HASKOIN_URL = process.env.HASKOIN_URL || "https://api.haskoin.com/bch";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=60");

  try {
    const r = await fetch(`${HASKOIN_URL}/block/best?notx=true`);
    if (!r.ok) throw new Error(`Haskoin responded ${r.status}`);
    const block = await r.json();

    res.status(200).json({
      height: block.height ?? null,
      hash: block.hash ?? null,
      time: block.time ?? null,
      status: "operational",
      source: "haskoin"
    });
  } catch (err) {
    // Network status is decorative, not critical — the client falls back
    // to a neutral "status unknown" state rather than blocking the page.
    res.status(502).json({ error: "Could not reach Haskoin Store", details: String(err) });
  }
}
