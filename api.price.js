/* ==========================================================================
   /api/price.js — Vercel serverless function (Node runtime)

   Real BCH/USD price + 24h change from CoinPaprika, matching the pricing
   source already used across the CashCompass projects. Free, keyless.
   Docs: https://api.coinpaprika.com/
   ========================================================================== */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=180");

  try {
    const r = await fetch("https://api.coinpaprika.com/v1/tickers/bch-bitcoin-cash");
    if (!r.ok) throw new Error(`CoinPaprika responded ${r.status}`);
    const json = await r.json();

    res.status(200).json({
      usd: json.quotes?.USD?.price ?? null,
      change24h: json.quotes?.USD?.percent_change_24h ?? null,
      source: "coinpaprika"
    });
  } catch (err) {
    res.status(502).json({ error: "Could not reach CoinPaprika", details: String(err) });
  }
}
