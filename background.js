chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const background = new BackgroundService();
    // ---
    console.log("[!] Message incoming: " + message.type);
    switch (message.type) {
        case "get-vaults":
            background.handleGetVaults(message.payload)
                .then((results) => {
                    sendResponse({ success: true, data: results });
                })
                .catch((err) => {
                    console.error("Errore in get-vaults:", err);
                    sendResponse({ success: false, error: err.message });
                });
            return true;
        default:
            // -- cattura dei messaggi non gestiti
            console.warn("Messaggio sconosciuto:", message);
            console.log('[ ----- ]');
            sendResponse({ success: false, error: "Unknown message type" });
            return true;
    }
});

class BackgroundService {
    /**
     * Restituisce i vault appropriati in base alla richiesta
     * @param {Object} param0 
     * @param {string} param0.name - titolo del vault  
     * @returns 
     */
    async handleGetVaults({ name }) {
        if (!name) {
            console.log('BackgroundService.handleGetVaults -> Invalid payload');
        }
        // -- carica i vaults dalla sessione
        const result = await chrome.storage.session.get("vaults");
        const vaults = result.vaults || [];
        // -- filtro per URL (inclusione) e match sul nome (case insensitive)
        const matched = vaults.filter(vault => {
            // -- catturo solo i logins
            if (vault.secrets?.ST !== 0) return false;
            // ---
            const titleOrUsername = name.toLowerCase();
            const nameMatch =
                vault.secrets?.T?.toLowerCase().includes(titleOrUsername)
                ||
                vault.secrets?.U?.toLowerCase().includes(titleOrUsername);
            return nameMatch;
        });
        // ---
        return matched;
    }
}