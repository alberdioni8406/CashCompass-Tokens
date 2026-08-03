/* ==========================================================================
   CashCompass Tokens — app.js
   Vanilla JS, no build step. Structured so a real backend can be dropped in
   later without touching the render layer — see "FUTURE INTEGRATIONS" below.

   FUTURE INTEGRATIONS (swap mock functions for real calls, same shapes):
   - BCH REST API (e.g. Haskoin Store: api.haskoin.com/bch) for live UTXO /
     address / tx data -> replace fetchTokens() and fetchTransactions()
   - CashTokens metadata registries (BCMR — Bitcoin Cash Metadata Registries)
     for verified token name/icon/description -> replace TOKENS[].* fields
   - Wallet connections (e.g. WalletConnect-style BCH wallets) for a
     "Connect Wallet" flow -> hook into a new connectWallet() function
   - Transaction indexing service for live tx feeds -> replace
     buildLedgerFeed() and detailTxList rendering
   - AI token explanations -> replace the static `utility` field with a
     generated explanation call, cached per category ID
   ========================================================================== */

(function(){
  "use strict";

  /* ---------------------------------------------------------------------
     MOCK DATA
     Category IDs are realistic-looking 32-byte (64 hex char) placeholders.
     Replace TOKENS with a fetchTokens() call against a real indexer later.
  --------------------------------------------------------------------- */
  const TOKENS = [
    {
      id: "brewbean-points",
      name: "BrewBean Points",
      symbol: "BEAN",
      categoryId: "9a3fce1d7b0284e5a6c19f0d3e8b2c47f915da0c6e2b7841fa03d9c1e5b6a728",
      type: "fungible",
      category: "loyalty",
      icon: "☕",
      supply: "1,000,000 BEAN",
      decimals: 2,
      creatorAddress: "bitcoincash:qz3k9v2h8m0y7x5w4t6r1p9n8l2j4k6h5vy0zqxwc3e",
      createdDate: "2025-03-14",
      holders: 428,
      txCount24h: 63,
      volume24h: 12400,
      growthPct: 18.4,
      activityLevel: "high",
      description: "Loyalty points issued by a small independent coffee roastery network.",
      utility: "BrewBean Points lets a coffee roastery reward repeat customers without building a loyalty app. Every purchase mints a small amount of BEAN to the buyer's wallet; baristas scan a QR code to redeem it at checkout. Because it settles on Bitcoin Cash, the roastery never has to run its own points ledger or trust a third-party rewards platform."
    },
    {
      id: "matola-market-pass",
      name: "Matola Market Pass",
      symbol: "MMKT",
      categoryId: "1c8ef27b4a0935de6f7b1c8a3e5d9024b8f6a1c3e7d5b9024f8a6c1e3d5b7092",
      type: "nft",
      category: "membership",
      icon: "🪪",
      supply: "312 / 500 issued",
      decimals: 0,
      creatorAddress: "bitcoincash:qp8x2n6h4v0y9w7t5r3p1l8k6j4h2g0f9d7c5b3a1s",
      createdDate: "2025-06-02",
      holders: 298,
      txCount24h: 11,
      volume24h: 900,
      growthPct: 6.1,
      activityLevel: "medium",
      description: "Vendor membership NFT for a grassroots BCH-accepting street market in Matola, Mozambique.",
      utility: "Each Market Pass NFT represents a registered stall at the market. Holding it proves the vendor is verified and in good standing, and it's checked by organizers each market day. Passes are transferable, so a vendor stepping back can sell their spot directly to the next person, on-chain, with no paperwork."
    },
    {
      id: "pixelforge-shard",
      name: "PixelForge Shard",
      symbol: "SHARD",
      categoryId: "4e7b1d9a3c5f8026b4d7a1e9c3f5081ec46a8d0b2f4e6a91c3d5b7f9024e6a83",
      type: "nft",
      category: "gaming-nft",
      icon: "🛡️",
      supply: "4,096 unique items",
      decimals: 0,
      creatorAddress: "bitcoincash:qr5m3k1h9v7y5w3t1p9n7l5j3h1g9f7d5c3b1a9s7q",
      createdDate: "2025-01-27",
      holders: 1_204,
      txCount24h: 187,
      volume24h: 41200,
      growthPct: 27.9,
      activityLevel: "high",
      description: "In-game equipment NFTs from an indie strategy game with true item ownership.",
      utility: "PixelForge Shards are the actual weapons and armor used inside an indie strategy game. Because each item is a CashToken, players genuinely own their gear — it can be traded, sold, or carried into future game seasons, instead of living in a studio's private database that can be wiped at any time."
    },
    {
      id: "riverfront-nights",
      name: "Riverfront Nights Pass",
      symbol: "RFN25",
      categoryId: "0d6b8f2a4c1e9375b0d6a8c2f4e19b73d5a7c9e1f30d5b8a6c4e2f0d8b6a4c92",
      type: "nft",
      category: "event-pass",
      icon: "🎟️",
      supply: "800 / 800 issued",
      decimals: 0,
      creatorAddress: "bitcoincash:qx1v9n7h5m3y1w9t7p5n3l1j9h7g5f3d1c9b7a5s3q",
      createdDate: "2025-05-18",
      holders: 754,
      txCount24h: 34,
      volume24h: 5600,
      growthPct: 41.2,
      activityLevel: "high",
      description: "Admission NFT for a monthly outdoor music series along the Maputo riverfront.",
      utility: "Riverfront Nights Pass is a scannable admission ticket. Organizers mint exactly 800 for each show, so supply is provably capped — no counterfeit tickets, no overselling. After the show, holders often keep the pass as a stamped memento, and some are resold peer-to-peer for later dates."
    },
    {
      id: "cassava-collective",
      name: "Cassava Collective Token",
      symbol: "CASV",
      categoryId: "7f2a9c5e1b3d8046c9f1a3e5b7d0248fc6a8e0b2d4f6a91c3e5d7f9b1024a6c8",
      type: "fungible",
      category: "community",
      icon: "🌾",
      supply: "5,000,000 CASV",
      decimals: 4,
      creatorAddress: "bitcoincash:qw9e7r5t3y1u9i7o5p3l1k9j7h5g3f1d9s7a5q3w1e",
      createdDate: "2024-11-09",
      holders: 96,
      txCount24h: 4,
      volume24h: 380,
      growthPct: -2.3,
      activityLevel: "low",
      description: "A farming cooperative's shared token used to record and reward collective labor contributions.",
      utility: "The Cassava Collective is a group of smallholder farmers pooling labor and equipment. Members earn CASV for hours contributed to shared work, and CASV can be spent on shared resources like a communal thresher. It's essentially a transparent, tamper-proof timesheet the whole cooperative can audit together."
    },
    {
      id: "studio-noir-editions",
      name: "Studio Noir Editions",
      symbol: "NOIR",
      categoryId: "b1e4a7c0d3f6805292b5e8c1d4f7a0396c9f2e5b8a1d4c7f0e3b6a9d2c5f8017",
      type: "nft",
      category: "collectible",
      icon: "🖼️",
      supply: "150 unique pieces",
      decimals: 0,
      creatorAddress: "bitcoincash:qm3n1l9k7j5h3g1f9d7c5b3a1s9q7w5e3r1t9y7u5i",
      createdDate: "2025-02-11",
      holders: 121,
      txCount24h: 9,
      volume24h: 3100,
      growthPct: 9.7,
      activityLevel: "medium",
      description: "Limited-run digital photography collection minted directly by the artist.",
      utility: "A photographer mints each print as a one-of-one NFT rather than selling limited-edition physical prints. Buyers get a provably scarce digital original with an on-chain chain of custody, and the artist keeps the full sale — no gallery cut, no marketplace lock-in."
    },
    {
      id: "verse-creator-key",
      name: "Verse Creator Key",
      symbol: "VERSE",
      categoryId: "e5c8b1f4a7d0930c6e9b2f5a8d1c4708e3b6a9d2f5c8b1a4d7f0c3e6b9a2d581",
      type: "fungible",
      category: "creator",
      icon: "🔑",
      supply: "250,000 VERSE",
      decimals: 2,
      creatorAddress: "bitcoincash:qy7u5i3o1p9a7s5d3f1g9h7j5k3l1z9x7c5v3b1n9m",
      createdDate: "2025-04-30",
      holders: 512,
      txCount24h: 28,
      volume24h: 7300,
      growthPct: 14.6,
      activityLevel: "medium",
      description: "A newsletter writer's supporter token that unlocks archive access and monthly calls.",
      utility: "Verse Creator Key is how a writer funds their newsletter directly. Holding a small amount unlocks the paid archive; holding more unlocks a monthly community call. Readers can resell the key if they stop subscribing, which a traditional subscription can never offer."
    },
    {
      id: "maputo-transit-credit",
      name: "Maputo Transit Credit",
      symbol: "MTC",
      categoryId: "3a6d9f2c5b8e1074a3d6c9f2b5e8017a4d7c0f3b6e9a2d5c8f1b4e7a0d3c6f92",
      type: "fungible",
      category: "loyalty",
      icon: "🚌",
      supply: "2,000,000 MTC",
      decimals: 2,
      creatorAddress: "bitcoincash:qn9m7l5k3j1h9g7f5d3c1b9a7s5q3w1e9r7t5y3u1i",
      createdDate: "2025-07-01",
      holders: 340,
      txCount24h: 52,
      volume24h: 9800,
      growthPct: 22.5,
      activityLevel: "high",
      description: "Prepaid transit credit for informal minibus (chapa) routes, settled in BCH.",
      utility: "Drivers on a informal minibus route accept MTC as prepaid fare. Riders top up once and tap through several trips without carrying small cash. Because settlement happens instantly on Bitcoin Cash, drivers can cash out their day's MTC to BCH the same evening."
    },
    {
      id: "founders-circle",
      name: "Founders Circle",
      symbol: "FNDR",
      categoryId: "6b9c2f5a8d1e4073b6c9f2a5d8e1074c3b6a9d2f5c8e1b4a7d0f3c6e9b2a5d81",
      type: "nft",
      category: "membership",
      icon: "🏛️",
      supply: "50 / 50 issued",
      decimals: 0,
      creatorAddress: "bitcoincash:qk1j9h7g5f3d1c9b7a5s3q1w9e7r5t3y1u9i7o5p3l",
      createdDate: "2024-09-22",
      holders: 50,
      txCount24h: 1,
      volume24h: 400,
      growthPct: 1.2,
      activityLevel: "low",
      description: "An NFT for the earliest 50 supporters of a BCH developer collective, granting governance voice.",
      utility: "Founders Circle marks the first 50 people who funded a developer collective before it had any product. Holding it grants a vote in how future grants from the collective's treasury are spent. It's a permanent, transferable receipt of early trust rather than a tradable speculative asset."
    },
    {
      id: "cornerstore-stamp",
      name: "Corner Store Stamp",
      symbol: "STAMP",
      categoryId: "8d1f4a7c0e3b69529d1c4f7a0e3b6925c8f1e4b7a0d3c6f9b2e5a8d1c4f7092",
      type: "fungible",
      category: "loyalty",
      icon: "🏪",
      supply: "800,000 STAMP",
      decimals: 0,
      creatorAddress: "bitcoincash:qj3h1g9f7d5c3b1a9s7q5w3e1r9t7y5u3i1o9p7a5s",
      createdDate: "2025-06-19",
      holders: 187,
      txCount24h: 21,
      volume24h: 1450,
      growthPct: 33.8,
      activityLevel: "high",
      description: "A neighborhood corner store's punch-card loyalty token — 10 stamps for a free item.",
      utility: "Corner Store Stamp replaces the paper punch-card. Every purchase mints one STAMP to the customer's wallet; ten stamps redeem a free item at the register. The shopkeeper avoids printing costs and lost cards, and can see redemption activity transparently on-chain."
    }
  ];

  const CATEGORY_LABELS = {
    "loyalty": "Loyalty",
    "membership": "Membership",
    "gaming-nft": "Gaming NFT",
    "event-pass": "Event Pass",
    "community": "Community",
    "collectible": "Collectible",
    "creator": "Creator"
  };

  /* ---------------------------------------------------------------------
     DATA FETCH LAYER
     The curated atlas (TOKENS) stays local mock/example data — it's an
     illustrative catalog, not a claim that these exact tokens exist
     on-chain. Network status, price, and the Live Lookup panel below call
     real serverless endpoints backed by real BCH indexers (see /api/*.js).
  --------------------------------------------------------------------- */
  async function fetchTokens(){
    // FUTURE: point this at a real CashTokens indexer/registry to replace
    // the curated atlas with live discovery once you have one running.
    return TOKENS;
  }

  async function fetchNetworkStatus(){
    const r = await fetch("/api/network");
    if (!r.ok) throw new Error("network status unavailable");
    return r.json();
  }

  async function fetchPrice(){
    const r = await fetch("/api/price");
    if (!r.ok) throw new Error("price unavailable");
    return r.json();
  }

  async function fetchLiveCategory(categoryId){
    const r = await fetch(`/api/token?category=${encodeURIComponent(categoryId)}`);
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || "lookup failed");
    return json;
  }

  async function fetchLiveAddress(address){
    const r = await fetch(`/api/address?address=${encodeURIComponent(address)}`);
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || "lookup failed");
    return json;
  }

  function buildLedgerFeed(){
    // FUTURE: replace with a live tx feed from a BCH indexer / websocket
    const verbs = ["minted to", "sent to", "redeemed by", "transferred to"];
    const feed = [];
    const now = Date.now();
    for (let i = 0; i < 6; i++){
      const tok = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const mins = (i + 1) * 3 + Math.floor(Math.random() * 4);
      feed.push({
        time: mins + "m ago",
        html: `<b>${tok.symbol}</b> ${verb} qz…${Math.random().toString(16).slice(2,6)}`,
        tag: tok.type === "nft" ? "NFT" : "FT",
        amber: tok.type === "nft"
      });
    }
    return feed;
  }

  function computeTransactions(token){
    // FUTURE: replace with real tx history for token.categoryId
    const types = ["mint", "send", "redeem"];
    const rows = [];
    for (let i = 0; i < 6; i++){
      const type = types[Math.floor(Math.random() * types.length)];
      rows.push({
        type,
        addr: "qz" + Math.random().toString(16).slice(2, 10) + "…" + Math.random().toString(16).slice(2, 6),
        time: `${(i + 1) * 7}m ago`
      });
    }
    return rows;
  }

  function computeHolderDistribution(token){
    // FUTURE: replace with real balance breakdown from an indexer
    const raw = [38, 21, 14, 9, 6, 4];
    return raw.map((pct, i) => ({
      label: i === raw.length - 1 ? "others" : `holder #${i + 1}`,
      pct
    }));
  }

  /* ---------------------------------------------------------------------
     STATE
  --------------------------------------------------------------------- */
  const state = {
    tokens: [],
    query: "",
    activeCategory: "all"
  };

  /* ---------------------------------------------------------------------
     HELPERS
  --------------------------------------------------------------------- */
  function fmtNumber(n){ return n.toLocaleString("en-US"); }
  function fmtUSDish(n){ return "$" + n.toLocaleString("en-US"); }
  function shortAddr(addr){
    const parts = addr.split(":");
    const body = parts[1] || addr;
    return "bitcoincash:" + body.slice(0,6) + "…" + body.slice(-6);
  }
  function shortCat(cat){ return cat.slice(0,10) + "…" + cat.slice(-8); }
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  /* ---------------------------------------------------------------------
     RENDER: DASHBOARD
  --------------------------------------------------------------------- */
  function renderDashboard(){
    const view = document.getElementById("view");
    const tpl = document.getElementById("tpl-dashboard");
    view.innerHTML = "";
    view.appendChild(tpl.content.cloneNode(true));

    renderConsoleFeed();
    renderStats();
    renderFilters();
    renderTokenGrid();
    renderTrending();
    initLiveLookup();

    document.getElementById("searchInput").addEventListener("input", (e) => {
      state.query = e.target.value.trim().toLowerCase();
      renderTokenGrid();
    });
  }

  function renderConsoleFeed(){
    const el = document.getElementById("consoleFeed");
    const feed = buildLedgerFeed();
    el.innerHTML = feed.map((f, i) => `
      <div class="feed-line" style="animation-delay:${i * 0.12}s">
        <span class="t">${f.time}</span>
        <span class="msg">${f.html}</span>
        <span class="tag${f.amber ? " amber" : ""}">${f.tag}</span>
      </div>
    `).join("");
  }

  async function renderStats(){
    const totalTx = TOKENS.reduce((s,t)=>s+t.txCount24h,0);
    const newCollections = TOKENS.filter(t => {
      const days = (Date.now() - new Date(t.createdDate)) / 86400000;
      return days < 45;
    }).length;

    // Network + price cards render a loading state immediately, then get
    // patched with real data from /api/network.js and /api/price.js. If
    // those calls fail (offline sandbox, indexer down, etc.) they fall
    // back to a clearly-labeled "status unknown" state rather than lying.
    const cards = [
      { id: "stat-total", label: "Total tokens discovered", value: fmtNumber(TOKENS.length) + "+", delta: "+2 this week", sub: "Across " + Object.keys(CATEGORY_LABELS).length + " categories" },
      { id: "stat-activity", label: "Recent token activity", value: fmtNumber(totalTx), delta: "+" + totalTx + " tx / 24h", sub: "Mints, sends & redemptions" },
      { id: "stat-collections", label: "New collections", value: fmtNumber(newCollections), delta: "last 45 days", sub: "Community & merchant launches" },
      { id: "stat-network", label: "BCH network status", value: "Checking…", delta: "live query", sub: "Haskoin Store" },
      { id: "stat-price", label: "BCH / USD", value: "Checking…", delta: "live query", sub: "CoinPaprika" }
    ];

    document.getElementById("statsGrid").innerHTML = cards.map(c => `
      <div class="stat-card" id="${c.id}">
        <p class="stat-label">${c.label}</p>
        <div class="stat-value">${c.value}</div>
        <p class="stat-sub">${c.sub}<br><span class="stat-delta">${c.delta}</span></p>
      </div>
    `).join("");

    fetchNetworkStatus().then(net => {
      const el = document.getElementById("stat-network");
      if (!el) return;
      el.querySelector(".stat-value").textContent = "Block " + fmtNumber(net.height);
      el.querySelector(".stat-sub").innerHTML = `Chain tip · live from Haskoin<br><span class="stat-delta">● operational</span>`;
    }).catch(() => {
      const el = document.getElementById("stat-network");
      if (!el) return;
      el.querySelector(".stat-value").textContent = "Status unknown";
      el.querySelector(".stat-sub").innerHTML = `Could not reach Haskoin Store<br><span class="stat-delta down">try again shortly</span>`;
    });

    fetchPrice().then(p => {
      const el = document.getElementById("stat-price");
      if (!el || p.usd == null) throw new Error("no price");
      el.querySelector(".stat-value").textContent = "$" + p.usd.toFixed(2);
      const up = (p.change24h ?? 0) >= 0;
      el.querySelector(".stat-sub").innerHTML = `24h change<br><span class="stat-delta${up ? "" : " down"}">${up ? "▲" : "▼"} ${Math.abs(p.change24h ?? 0).toFixed(2)}%</span>`;
    }).catch(() => {
      const el = document.getElementById("stat-price");
      if (!el) return;
      el.querySelector(".stat-value").textContent = "Unavailable";
      el.querySelector(".stat-sub").innerHTML = `Could not reach CoinPaprika<br><span class="stat-delta down">try again shortly</span>`;
    });
  }

  function renderFilters(){
    const cats = ["all", ...Object.keys(CATEGORY_LABELS)];
    document.getElementById("filterRow").innerHTML = cats.map(c => `
      <button class="filter-chip${state.activeCategory === c ? " active" : ""}" data-cat="${c}">
        ${c === "all" ? "All tokens" : CATEGORY_LABELS[c]}
      </button>
    `).join("");

    document.querySelectorAll(".filter-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeCategory = btn.dataset.cat;
        renderFilters();
        renderTokenGrid();
      });
    });
  }

  function matchesQuery(t, q){
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.categoryId.toLowerCase().includes(q) ||
      t.creatorAddress.toLowerCase().includes(q)
    );
  }

  function renderTokenGrid(){
    let list = TOKENS.filter(t => matchesQuery(t, state.query));
    if (state.activeCategory !== "all"){
      list = list.filter(t => t.category === state.activeCategory);
    }

    document.getElementById("resultCount").textContent =
      `${list.length} token${list.length === 1 ? "" : "s"} found`;

    const grid = document.getElementById("tokenGrid");
    const empty = document.getElementById("emptyState");

    if (list.length === 0){
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = list.map(t => `
      <article class="token-card" data-id="${t.id}" tabindex="0" role="button" aria-label="View ${escapeHtml(t.name)} details">
        <span class="token-stamp${t.type === "nft" ? " nft" : ""}">${t.icon}</span>
        <div class="token-card-top">
          <div class="token-glyph">${t.icon}</div>
          <div>
            <p class="token-name">${escapeHtml(t.name)}</p>
            <p class="token-symbol">${t.symbol}</p>
            <span class="type-badge${t.type === "nft" ? " nft" : ""}">${t.type === "nft" ? "NFT" : "Fungible"}</span>
          </div>
        </div>
        <p class="token-desc">${escapeHtml(t.description)}</p>
        <p class="token-catid"><b>Category</b> ${shortCat(t.categoryId)}</p>
        <div class="token-meta-row">
          <div>Supply<b>${t.supply.split(" ")[0]}</b></div>
          <div>Holders<b>${fmtNumber(t.holders)}</b></div>
          <div>Tx / 24h<b>${t.txCount24h}</b></div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".token-card").forEach(card => {
      card.addEventListener("click", () => { location.hash = "#/token/" + card.dataset.id; });
      card.addEventListener("keypress", (e) => {
        if (e.key === "Enter") location.hash = "#/token/" + card.dataset.id;
      });
    });
  }

  function renderTrending(){
    const top = [...TOKENS].sort((a,b) => b.growthPct - a.growthPct).slice(0,6);
    document.getElementById("trendingList").innerHTML = top.map((t,i) => `
      <div class="trend-row" data-id="${t.id}">
        <span class="trend-rank">#${i+1}</span>
        <span class="trend-name">${escapeHtml(t.name)}<span>${CATEGORY_LABELS[t.category]} · ${t.type === "nft" ? "NFT" : "Fungible"}</span></span>
        <span class="activity-pill ${t.activityLevel}">${t.activityLevel}</span>
        <span class="trend-volume">${fmtUSDish(t.volume24h)} vol</span>
        <span class="trend-growth">▲ ${t.growthPct}%</span>
      </div>
    `).join("");

    document.querySelectorAll(".trend-row").forEach(row => {
      row.addEventListener("click", () => { location.hash = "#/token/" + row.dataset.id; });
    });
  }

  /* ---------------------------------------------------------------------
     LIVE ON-CHAIN LOOKUP  (real network calls — see api/token.js, api/address.js)
  --------------------------------------------------------------------- */
  function fmtBch(sats){
    if (sats == null) return "—";
    return (Number(sats) / 1e8).toLocaleString("en-US", { maximumFractionDigits: 8 }) + " BCH";
  }
  function fmtTime(unixSeconds){
    if (!unixSeconds) return "unconfirmed";
    return new Date(unixSeconds * 1000).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  }

  function initLiveLookup(){
    const input = document.getElementById("lookupInput");
    const btn = document.getElementById("lookupBtn");
    const resultEl = document.getElementById("lookupResult");
    if (!input || !btn) return; // not on this view

    let lookupType = "category";

    document.querySelectorAll("[data-lookup-type]").forEach(chip => {
      chip.addEventListener("click", () => {
        lookupType = chip.dataset.lookupType;
        document.querySelectorAll("[data-lookup-type]").forEach(c => c.classList.toggle("active", c === chip));
        input.placeholder = lookupType === "category"
          ? "64-char category ID (e.g. a genesis txid)"
          : "bitcoincash:q… address";
      });
    });

    async function runLookup(){
      const value = input.value.trim();
      if (!value){
        resultEl.innerHTML = `<p class="lookup-state error">Enter a category ID or address first.</p>`;
        return;
      }
      resultEl.innerHTML = `<p class="lookup-state">Querying Bitcoin Cash mainnet…</p>`;

      try {
        if (lookupType === "category"){
          const data = await fetchLiveCategory(value.toLowerCase());
          renderCategoryResult(data);
        } else {
          const data = await fetchLiveAddress(value);
          renderAddressResult(data);
        }
      } catch (err){
        resultEl.innerHTML = `<p class="lookup-state error">${escapeHtml(err.message || "Lookup failed")}</p>`;
      }
    }

    function renderCategoryResult(d){
      resultEl.innerHTML = `
        <div class="lookup-card">
          <h3>Genesis transaction <span class="live-chip">live · chaingraph</span></h3>
          <div class="lookup-grid">
            <div><dt>Category ID</dt><dd>${d.categoryId}</dd></div>
            <div><dt>Status</dt><dd>${d.confirmed ? "Confirmed" : "Unconfirmed"}</dd></div>
            <div><dt>Block height</dt><dd>${d.blockHeight ?? "—"}</dd></div>
            <div><dt>Block time</dt><dd>${fmtTime(d.blockTime)}</dd></div>
          </div>
          ${d.genesisOutputs && d.genesisOutputs.length ? `
            <div class="lookup-nft-list">
              ${d.genesisOutputs.map(o => `
                <div class="lookup-nft-row">
                  <span>Output #${o.outputIndex} · ${o.satoshis} sats</span>
                  <span>${o.fungibleAmount ? "Fungible amount: " + o.fungibleAmount : (o.nftCapability ? "NFT · " + o.nftCapability : "—")}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
          <p style="margin-top:14px;"><a href="${d.explorerUrl}" target="_blank" rel="noopener">View genesis tx in a block explorer →</a></p>
        </div>
      `;
    }

    function renderAddressResult(d){
      resultEl.innerHTML = `
        <div class="lookup-card">
          <h3>Address holdings <span class="live-chip">live · mainnet.cash</span></h3>
          <div class="lookup-grid">
            <div><dt>Address</dt><dd>${d.address}</dd></div>
            <div><dt>BCH balance</dt><dd>${fmtBch(d.bchSatoshis)}</dd></div>
          </div>
          ${d.tokenBalances && d.tokenBalances.length ? `
            <div class="lookup-nft-list">
              ${d.tokenBalances.map(t => `
                <div class="lookup-nft-row">
                  <span>${shortCat(t.category)}</span>
                  <span>${t.fungibleAmount ? "Fungible: " + fmtNumber(t.fungibleAmount) : ""}${t.nfts.length ? " · " + t.nfts.length + " NFT" + (t.nfts.length === 1 ? "" : "s") : ""}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="lookup-state" style="padding:8px 0;">No CashTokens found at this address.</p>`}
        </div>
      `;
    }

    btn.addEventListener("click", runLookup);
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") runLookup(); });

    // If a wallet is already connected, offer a one-tap lookup of its address.
    if (window.CCWallet && window.CCWallet.getState().connected){
      lookupType = "address";
      document.querySelectorAll("[data-lookup-type]").forEach(c => c.classList.toggle("active", c.dataset.lookupType === "address"));
      input.value = window.CCWallet.getState().address;
      input.placeholder = "bitcoincash:q… address";
      runLookup();
    }
  }

  /* ---------------------------------------------------------------------
     WALLET BUTTON  (real BCH WalletConnect — see wallet.js)
  --------------------------------------------------------------------- */
  function initWalletButton(){
    const btn = document.getElementById("walletBtn");
    const label = document.getElementById("walletBtnLabel");
    if (!btn) return;

    function paint(state){
      if (!window.CCWallet) {
        label.textContent = "Wallet unavailable";
        return;
      }
      btn.classList.toggle("connected", state.connected);
      label.textContent = state.connected
        ? state.address.slice(0, 10) + "…" + state.address.slice(-6)
        : "Connect wallet";
    }

    btn.addEventListener("click", async () => {
      if (!window.CCWallet){
        alert("Wallet module failed to load — check your network connection to esm.sh.");
        return;
      }
      const state = window.CCWallet.getState();
      try {
        if (state.connected){
          await window.CCWallet.disconnectWallet();
        } else {
          label.textContent = "Connecting…";
          await window.CCWallet.connectWallet();
        }
      } catch (err){
        alert(err.message || "Wallet connection failed");
        paint(window.CCWallet.getState());
      }
    });

    if (window.CCWallet){
      paint(window.CCWallet.getState());
      window.CCWallet.onWalletChange(paint);
    } else {
      // wallet.js (a module script) may not have finished evaluating yet on
      // very slow connections — retry once shortly after load.
      setTimeout(() => {
        if (window.CCWallet){
          paint(window.CCWallet.getState());
          window.CCWallet.onWalletChange(paint);
        }
      }, 800);
    }
  }

  /* ---------------------------------------------------------------------
     RENDER: TOKEN DETAIL
  --------------------------------------------------------------------- */
  function renderDetail(id){
    const token = TOKENS.find(t => t.id === id);
    const view = document.getElementById("view");

    if (!token){
      view.innerHTML = `<div class="wrap" style="padding:80px 0; text-align:center;">
        <p class="eyebrow" style="justify-content:center;">404</p>
        <h2>Token not found</h2>
        <p class="section-lede">That category ID doesn't match anything in the atlas yet.</p>
        <a href="#explorer" class="btn btn-primary" style="margin-top:16px;">Back to explorer</a>
      </div>`;
      return;
    }

    const tpl = document.getElementById("tpl-detail");
    view.innerHTML = "";
    view.appendChild(tpl.content.cloneNode(true));

    document.getElementById("detailMedia").textContent = token.icon;
    document.getElementById("detailCategoryChip").textContent = "CATEGORY " + shortCat(token.categoryId);
    document.getElementById("detailName").textContent = token.name;
    document.getElementById("detailSymbol").textContent = token.symbol + " · " + CATEGORY_LABELS[token.category];
    document.getElementById("detailDesc").textContent = token.description;
    document.getElementById("detailUtility").textContent = token.utility;

    document.getElementById("detailBadges").innerHTML = `
      <span class="type-badge${token.type === "nft" ? " nft" : ""}">${token.type === "nft" ? "NFT" : "Fungible"}</span>
      <span class="activity-pill ${token.activityLevel}">${token.activityLevel} activity</span>
    `;

    document.getElementById("specList").innerHTML = `
      <div><dt>Category ID</dt><dd>${token.categoryId}</dd></div>
      <div><dt>Type</dt><dd>${token.type === "nft" ? "Non-fungible (NFT)" : "Fungible"}</dd></div>
      <div><dt>Supply</dt><dd>${token.supply}</dd></div>
      <div><dt>Decimals</dt><dd>${token.decimals}</dd></div>
      <div><dt>Creator address</dt><dd>${shortAddr(token.creatorAddress)}</dd></div>
      <div><dt>Created</dt><dd>${token.createdDate}</dd></div>
      <div><dt>Holders</dt><dd>${fmtNumber(token.holders)}</dd></div>
      <div><dt>Tx / 24h</dt><dd>${token.txCount24h}</dd></div>
    `;

    const txRows = computeTransactions(token);
    document.getElementById("detailTxList").innerHTML = txRows.map(r => `
      <div class="tx-row">
        <span class="tx-type${r.type === "send" ? " send" : ""}">${r.type}</span>
        <span class="tx-addr">${r.addr}</span>
        <span class="tx-time">${r.time}</span>
      </div>
    `).join("");

    const holders = computeHolderDistribution(token);
    document.getElementById("detailHolderBars").innerHTML = holders.map(h => `
      <div class="holder-bar-row">
        <span class="holder-bar-label">${h.label}</span>
        <span class="holder-bar-track"><span class="holder-bar-fill" style="width:${h.pct}%"></span></span>
        <span class="holder-bar-pct">${h.pct}%</span>
      </div>
    `).join("");

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ---------------------------------------------------------------------
     ROUTER
  --------------------------------------------------------------------- */
  function router(){
    const hash = location.hash || "#/";
    const detailMatch = hash.match(/^#\/token\/(.+)$/);

    if (detailMatch){
      renderDetail(decodeURIComponent(detailMatch[1]));
    } else {
      renderDashboard();
    }
  }

  /* ---------------------------------------------------------------------
     NAV TOGGLE (mobile)
  --------------------------------------------------------------------- */
  function initNav(){
    const toggle = document.getElementById("navToggle");
    const nav = document.querySelector(".main-nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  /* ---------------------------------------------------------------------
     INIT
  --------------------------------------------------------------------- */
  window.addEventListener("hashchange", router);
  document.addEventListener("DOMContentLoaded", async () => {
    initNav();
    initWalletButton(); // header lives outside the routed #view, wire once
    state.tokens = await fetchTokens(); // FUTURE: real API call
    router();
  });

})();
