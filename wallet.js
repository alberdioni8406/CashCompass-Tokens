/* ==========================================================================
   wallet.js — real BCH wallet connection

   Implements the BCH WalletConnect standard, "wc2-bch-bcr"
   (https://github.com/mainnet-pat/wc2-bch-bcr), the spec supported by
   Cashonize, Paytaca, and Zapit. This is a genuine wallet-connect flow —
   scanning the QR with a real wallet requests real approval and returns a
   real address — not a mock.

   Loaded as an ES module (see the type="module" script tag in index.html)
   so it can import @walletconnect/sign-client directly from a CDN with no
   bundler. It exposes a small `window.CCWallet` API so the rest of the app
   (app.js, a classic script) can use it without also becoming a module.

   WalletConnect sessions need a "Project ID" from https://cloud.reown.com
   (free) — this is a public client identifier, comparable to a Google Maps
   browser key, safe to ship in client code, NOT a secret. WC_PROJECT_ID
   below is already set to a real project ID.

   HONESTY NOTE: CDN-hosted ESM builds of @walletconnect/sign-client can be
   sensitive to Node polyfills (Buffer, process) depending on version and
   CDN. This is wired up against the real protocol and real namespaces, but
   test the connect flow against your chosen CDN/version before shipping —
   if esm.sh gives you trouble, bundling the package yourself with esbuild
   or Vite is the more robust path for a real production deploy.

   FUTURE INTEGRATIONS:
   - bch_signTransaction — once you have real spend flows (checkout, mint),
     use CashScript's TransactionBuilder.generateWcTransactionObject() and
     request signing through this same session.
   - addressesChanged event — currently just re-notifies listeners; wire it
     to re-run the live address lookup if you want the UI to track address
     switches inside the wallet.
   ========================================================================== */

import SignClient from "https://esm.sh/@walletconnect/sign-client@2?bundle";

const WC_PROJECT_ID = "c7c933a47b59d19f19d9d64b2726eb98";

const REQUIRED_NAMESPACES = {
  bch: {
    chains: ["bch:bitcoincash"],
    methods: ["bch_getAddresses", "bch_signTransaction", "bch_signMessage"],
    events: ["addressesChanged"]
  }
};

let client = null;
let session = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(getState()));
}

function getState() {
  const account = session?.namespaces?.bch?.accounts?.[0]; // "bch:bitcoincash:qz..."
  return {
    connected: !!session,
    address: account ? account.split(":")[2] : null
  };
}

async function getClient() {
  if (client) return client;

  client = await SignClient.init({
    projectId: WC_PROJECT_ID,
    metadata: {
      name: "CashCompass Tokens",
      description: "A Bitcoin Cash CashTokens explorer and ecosystem atlas",
      url: typeof window !== "undefined" ? window.location.origin : "https://cashcompass.space",
      icons: []
    }
  });

  const existing = client.session.getAll();
  if (existing.length) session = existing[existing.length - 1];

  client.on("session_delete", () => { session = null; notify(); });
  client.on("session_event", () => { notify(); }); // e.g. addressesChanged

  return client;
}

/**
 * Opens a WalletConnect pairing (shows a QR modal) and resolves once a
 * wallet approves the session.
 */
async function connectWallet() {
  const c = await getClient();
  const { uri, approval } = await c.connect({ requiredNamespaces: REQUIRED_NAMESPACES });

  if (uri) showPairingModal(uri);

  try {
    session = await approval();
    notify();
    return getState();
  } finally {
    hidePairingModal();
  }
}

async function disconnectWallet() {
  if (!client || !session) return;
  await client.disconnect({ topic: session.topic, reason: { code: 6000, message: "User disconnected" } });
  session = null;
  notify();
}

/** Request the connected wallet to sign an arbitrary message (proof of address ownership, etc). */
async function signMessage(message) {
  if (!client || !session) throw new Error("No active wallet session");
  return client.request({
    topic: session.topic,
    chainId: "bch:bitcoincash",
    request: { method: "bch_signMessage", params: { message } }
  });
}

/* ---- minimal pairing QR modal — plain DOM, no extra dependencies ---- */
function showPairingModal(uri) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(uri)}`;
  const overlay = document.createElement("div");
  overlay.id = "wcModal";
  overlay.className = "wc-modal-overlay";
  overlay.innerHTML = `
    <div class="wc-modal">
      <p class="wc-modal-title">Scan with a BCH wallet</p>
      <img src="${qrSrc}" alt="WalletConnect pairing QR code" width="260" height="260" />
      <p class="wc-modal-hint">Cashonize, Paytaca, and Zapit all support WalletConnect for Bitcoin Cash.</p>
      <button class="btn btn-ghost" id="wcModalClose" type="button">Cancel</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("wcModalClose").addEventListener("click", hidePairingModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) hidePairingModal(); });
}
function hidePairingModal() {
  document.getElementById("wcModal")?.remove();
}

// Bridge to the classic (non-module) app.js
window.CCWallet = {
  connectWallet,
  disconnectWallet,
  signMessage,
  getState,
  onWalletChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};
