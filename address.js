/* ==========================================================================
   /api/address.js — Vercel serverless function (Node runtime)

   Looks up REAL CashToken holdings for a BCH address using a WATCH-ONLY
   wallet reference against mainnet.cash's REST service. Watch-only wallets
   are built purely from a cashaddr string and never touch a private key —
   this endpoint cannot move funds, only read them.
   Docs: https://mainnet.cash/tutorial/rest.html#watch-only-wallets

   Provider: rest-unstable.mainnet.cash, mainnet.cash's public demo
   instance. It's explicitly labeled "unstable" by its maintainers — fine
   for a dashboard like this, but for serious production load you should
   run your own instance (one `docker run`, see mainnet.cash docs) and
   point MAINNET_REST_URL at it via a Vercel environment variable.
   ========================================================================== */

const MAINNET_REST_URL = process.env.MAINNET_REST_URL || "https://rest-unstable.mainnet.cash";

function isValidCashaddr(addr) {
  const body = addr.replace(/^bitcoincash:/i, "");
  return /^[qp][a-z0-9]{41}$/i.test(body);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

  const raw = String(req.query.address || "").trim();
  if (!raw || !isValidCashaddr(raw)) {
    res.status(400).json({ error: "address must be a valid mainnet BCH cashaddr" });
    return;
  }
  const cashaddr = raw.startsWith("bitcoincash:") ? raw : `bitcoincash:${raw}`;
  const walletId = `watch:mainnet:${cashaddr}`;

  try {
    const [utxoRes, balRes] = await Promise.all([
      fetch(`${MAINNET_REST_URL}/wallet/get_token_utxos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId })
      }),
      fetch(`${MAINNET_REST_URL}/wallet/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId })
      })
    ]);

    if (!utxoRes.ok) throw new Error(`get_token_utxos responded ${utxoRes.status}`);
    if (!balRes.ok) throw new Error(`balance responded ${balRes.status}`);

    const utxoJson = await utxoRes.json();
    const balJson = await balRes.json();

    // Group raw token UTXOs into per-category balances (fungible amount
    // summed, NFTs listed individually with their commitment/capability).
    const byCategory = {};
    for (const u of utxoJson.utxos || []) {
      if (!u.token) continue;
      const cat = u.token.category;
      if (!byCategory[cat]) byCategory[cat] = { category: cat, fungibleAmount: 0, nfts: [] };
      if (u.token.amount) byCategory[cat].fungibleAmount += Number(u.token.amount);
      if (u.token.nft) {
        byCategory[cat].nfts.push({
          capability: u.token.nft.capability,
          commitment: u.token.nft.commitment,
          txid: u.txid,
          vout: u.vout
        });
      }
    }

    res.status(200).json({
      address: cashaddr,
      bchSatoshis: balJson.sat ?? balJson.balance ?? null,
      tokenBalances: Object.values(byCategory),
      source: "mainnet.cash (watch-only, read-only)"
    });
  } catch (err) {
    res.status(502).json({ error: "Could not reach the mainnet.cash REST service", details: String(err) });
  }
}
