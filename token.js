/* ==========================================================================
   /api/token.js — Vercel serverless function (Node runtime)

   Resolves a REAL CashToken category ID against Chaingraph, a public
   GraphQL indexer for Bitcoin Cash (https://chaingraph.cash). A token's
   category ID is the txid of its genesis transaction, so this looks that
   transaction up directly on-chain — no mock data, no guessing.

   Provider: a community-run public Chaingraph instance. No API key
   required. Override via the CHAINGRAPH_URL environment variable if you
   run your own instance or the community endpoint changes.
   Docs: https://github.com/bitauth/chaingraph · https://chaingraph.cash

   NOTE ON SCHEMA STABILITY: Chaingraph's GraphQL schema is community-run
   and can shift between versions. If this query starts failing, open
   https://try.chaingraph.cash (GraphiQL) against CHAINGRAPH_URL and adjust
   the field names below to match the live schema before assuming the
   token/category itself is invalid.

   FUTURE: this only reads the genesis transaction. To show live circulating
   supply or full holder counts you'll want a second, heavier query (or a
   dedicated CashTokens indexer) that sums unspent outputs for the category
   — left as a clearly-scoped follow-up rather than guessed at here.
   ========================================================================== */

const CHAINGRAPH_URL = process.env.CHAINGRAPH_URL || "https://gql.chaingraph.pat.mn/v1/graphql";

const QUERY = `
  query TokenGenesis($txHash: bytea!) {
    transaction(where: { hash: { _eq: $txHash } }) {
      hash
      size_bytes
      block_inclusions {
        block { height timestamp }
      }
      outputs {
        output_index
        value_satoshis
        token_category
        fungible_token_amount
        nonfungible_token_capability
        nonfungible_token_commitment
      }
    }
  }
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  const categoryId = String(req.query.category || "").toLowerCase().trim();
  if (!/^[0-9a-f]{64}$/.test(categoryId)) {
    res.status(400).json({ error: "category must be a 64-character hex CashTokens category ID" });
    return;
  }

  try {
    const gqlRes = await fetch(CHAINGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { txHash: `\\x${categoryId}` } })
    });

    if (!gqlRes.ok) throw new Error(`Chaingraph responded ${gqlRes.status}`);
    const json = await gqlRes.json();

    if (json.errors) {
      res.status(502).json({ error: "Chaingraph query error — schema may have changed, see file comments", details: json.errors });
      return;
    }

    const tx = json.data && json.data.transaction && json.data.transaction[0];
    if (!tx) {
      res.status(404).json({ error: "No genesis transaction found for that category ID on mainnet" });
      return;
    }

    const genesisOutputs = (tx.outputs || []).filter(o => o.token_category);

    res.status(200).json({
      categoryId,
      genesisTxid: tx.hash,
      sizeBytes: tx.size_bytes,
      blockHeight: (tx.block_inclusions && tx.block_inclusions[0] && tx.block_inclusions[0].block.height) ?? null,
      blockTime: (tx.block_inclusions && tx.block_inclusions[0] && tx.block_inclusions[0].block.timestamp) ?? null,
      confirmed: !!(tx.block_inclusions && tx.block_inclusions.length),
      genesisOutputs: genesisOutputs.map(o => ({
        outputIndex: o.output_index,
        satoshis: o.value_satoshis,
        fungibleAmount: o.fungible_token_amount,
        nftCapability: o.nonfungible_token_capability,
        nftCommitment: o.nonfungible_token_commitment
      })),
      source: "chaingraph",
      explorerUrl: `https://explorer.bch.ninja/tx/${tx.hash}`
    });
  } catch (err) {
    res.status(502).json({ error: "Could not reach the Chaingraph indexer", details: String(err) });
  }
}
