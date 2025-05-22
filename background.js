// background.js (Service Worker)

let vaults = null;

// Timestamp dell'ultimo accesso (per eventuale timeout)
let lastVaultAccess = null;

// Listener dei messaggi
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "check-vault-status":
            // Risponde se i vault sono in memoria
            sendResponse({ hasVault: !!vaults });
            return true;

        case "store-vault":
            // Riceve i vault decifrati dal popup e li memorizza
            if (Array.isArray(message.payload)) {
                vaults = message.payload;
                lastVaultAccess = Date.now();
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: "Invalid vault data" });
            }
            return true;

        default:
            // Catch-all se arrivano messaggi non gestiti
            console.warn("Messaggio sconosciuto:", message);
            sendResponse({ success: false, error: "Unknown message type" });
            return true;
    }
});
