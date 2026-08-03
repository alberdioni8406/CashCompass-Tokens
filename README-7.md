# CashCompass Tokens

A Bitcoin Cash CashTokens explorer and ecosystem atlas. Static HTML/CSS/JS
frontend + a handful of small Vercel serverless functions that proxy real
BCH data sources. No build step, no framework, no bundler.

Part of the CashCompass / BCH Lab family.

## What's real vs. what's curated

- **The Explorer / Trending / Atlas grid** (`app.js` → `TOKENS`) is curated
  **example** data — ten illustrative CashTokens written to demonstrate the
  categories (loyalty, membership, NFT, event pass, etc.) without needing a
  live registry of "notable" tokens to launch with. They're labeled as such
  in the UI.
- **The Live Lookup panel** and **stat cards** hit real Bitcoin Cash mainnet
  through the serverless functions in `/api`. Paste in a real 64-character
  category ID or a real address and you'll get a real on-chain answer.
- **Wallet Connect** opens a real WalletConnect session using the BCH
  WalletConnect standard (see below) — scanning the QR with Cashonize,
  Paytaca, or Zapit performs a real approval and returns a real address.

## Architecture

```
index.html          entry point, hash-routed SPA shell
style.css            design system
app.js                render logic, mock atlas, live-lookup + stats wiring
wallet.js             BCH WalletConnect (ES module, loaded separately)
api/
  token.js            GET ?category=<64-hex>  → Chaingraph genesis lookup
  address.js           GET ?address=<cashaddr> → mainnet.cash watch-only token UTXOs
  network.js            GET                      → Haskoin Store chain tip
  price.js               GET                      → CoinPaprika BCH/USD
assets/               static files (none required to run)
```

Each `/api/*.js` file is a standalone Vercel Node serverless function
(`export default async function handler(req, res)`), deployed automatically
— no config needed beyond the `api/` folder existing. `package.json` sets
`"type": "module"` so the `export default` syntax works on Vercel's Node
runtime.

## Data sources (all free, all keyless)

| Source | Used for | Notes |
|---|---|---|
| [Chaingraph](https://chaingraph.cash) (public instance) | Category/genesis lookup | Community-run GraphQL indexer. Override with `CHAINGRAPH_URL` env var. Schema can shift — see comments in `api/token.js`. |
| [mainnet.cash](https://mainnet.cash) REST (`rest-unstable.mainnet.cash`) | Address → token UTXOs | Watch-only wallet references only — no private keys ever touch this. Labeled "unstable" by its own maintainers; point `MAINNET_REST_URL` at your own instance for real production traffic. |
| [Haskoin Store](https://api.haskoin.com/bch) | Network status (chain tip) | Same BCH data source used across the other CashCompass projects. |
| [CoinPaprika](https://api.coinpaprika.com) | BCH/USD price | Same pricing source used across the other CashCompass projects. |

None of these require an API key. All calls happen server-side in `/api`,
so no third-party origin is ever exposed directly to the browser, and it's
easy to swap a provider later by changing one env var instead of client code.

## Wallet integration

Uses the BCH WalletConnect standard, **`wc2-bch-bcr`**
(https://github.com/mainnet-pat/wc2-bch-bcr), supported by Cashonize,
Paytaca, and Zapit. `wallet.js` is loaded as an ES module so it can import
`@walletconnect/sign-client` straight from a CDN (`esm.sh`) with zero
bundler — it exposes `window.CCWallet` for the rest of the (non-module)
app to use.

**Setup required before "Connect wallet" will work:**

1. Get a free Project ID at https://cloud.reown.com (this is a public
   client identifier, like a Google Maps browser key — not a secret, safe
   to commit).
2. Open `wallet.js` and replace `WC_PROJECT_ID`'s placeholder value with it.

The connect flow requests `bch_getAddresses`, `bch_signTransaction`, and
`bch_signMessage` permissions and shows a QR pairing code. Test it against
a real wallet before shipping — CDN ESM builds of WalletConnect's
sign-client can be sensitive to Node polyfills depending on version; if
`esm.sh` gives you trouble, bundling the package yourself (esbuild/Vite)
is the more robust path for production.

## Environment variables (all optional — sensible defaults are built in)

| Var | Default | Purpose |
|---|---|---|
| `CHAINGRAPH_URL` | `https://gql.chaingraph.pat.mn/v1/graphql` | Chaingraph GraphQL endpoint |
| `MAINNET_REST_URL` | `https://rest-unstable.mainnet.cash` | mainnet.cash REST endpoint |
| `HASKOIN_URL` | `https://api.haskoin.com/bch` | Haskoin Store base URL |

Set these in the Vercel dashboard under Project → Settings → Environment
Variables — never commit real overrides to the repo.

## Deploying

1. Push this folder to a GitHub repo.
2. Import it in Vercel — no build command needed (static + serverless
   functions are auto-detected).
3. Set env vars above if you're pointing at your own indexers.
4. Set `WC_PROJECT_ID` in `wallet.js` before relying on wallet connect.

## Next real integrations (see inline `FUTURE:` comments)

- Swap the curated `TOKENS` atlas for a live CashTokens registry / BCMR feed.
- Add `bch_signTransaction` flows (e.g. tipping, minting) once there's a
  real spend path, using CashScript's `generateWcTransactionObject`.
- Cache `/api/token.js` and `/api/address.js` responses in a KV store if
  lookup volume grows past what the public Chaingraph/mainnet.cash
  instances comfortably serve.
