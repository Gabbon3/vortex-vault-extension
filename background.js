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
    constructor(maxResults = 5) {
        // applicato solo alle ricerche classiche, quindi non a quelle solo totp
        this.maxResults = maxResults;
    }
    
    /**
    * Restituisce i vault con URL che matchano con quello fornito
    * @param {string} url - URL corrente della pagina
    * @returns {Array|false}
    */
    async getVaultsByUrl(url) {
        if (!url) return false;

        // -- carica i vaults dalla sessione
        const result = await chrome.storage.session.get("vaults");
        const vaults = result.vaults || [];

        // -- se non ci sono vault, ritorno false
        if (vaults.length === 0) return false;

        // -- filtro solo vault con URL matching e login (ST === 0)
        return vaults.filter(vault => {
            const secrets = vault.secrets;
            if (!secrets || secrets.ST !== 0) return false;

            const raw = secrets.H || "";

            // -- estrae eventuali regex nel formato /.../r
            const regexMatches = [...raw.matchAll(/\/(.+?)\/r/g)].map(m => m[1]);

            let urlMatch = false;

            if (regexMatches.length > 0) {
                urlMatch = regexMatches.some(pattern => {
                    try {
                        return new RegExp(pattern).test(url);
                    } catch {
                        return false;
                    }
                });
            }

            // -- fallback su includes se nessuna regex valida ha matchato
            if (!urlMatch && raw.includes(url)) {
                urlMatch = true;
            }

            if (urlMatch) {
                vault.urlMatch = true;
                return true;
            }

            return false;
        });
    }

    /**
     * Cerca vault per nome o username, ignora URL
     * @param {string} name - nome o username da cercare
     * @param {boolean} totpOnly - true per ottenere solo vault con totp
     * @returns {Array|false} - lista vault trovati o false
     */
    async searchVaultsByName(name, totpOnly = false) {
        if (!name) return false;

        // -- carica i vaults dalla sessione
        const result = await chrome.storage.session.get("vaults");
        const vaults = result.vaults || [];

        // -- se non ci sono vault, ritorno false
        if (vaults.length === 0) return false;

        const query = name.toLowerCase();

        // -- filtro per nome/username e totp se richiesto
        const matched = vaults.filter(vault => {
            const secrets = vault.secrets;
            if (!secrets || secrets.ST !== 0) return false;

            if (totpOnly) return !!secrets.O;

            const nameMatch =
                secrets.T?.toLowerCase().includes(query) ||
                secrets.U?.toLowerCase().includes(query);

            return nameMatch;
        });

        // -- limito i risultati se non totpOnly
        return totpOnly ? matched : matched.slice(0, this.maxResults);
    }

    /**
     * Restituisce i vault appropriati in base alla richiesta
     * @param {Object} param0 
     * @param {string} param0.name - titolo del vault  
     * @param {string} param0.url - url corrente
     * @param {boolean} param0.totpOnly - true per ottenere solo i vault con totp
     * @returns {Array|false} - lista vault filtrati o false se nessuno trovato
     */
    async handleGetVaults({ name, url, totpOnly = false }) {
        if (!name && !url && !totpOnly) {
            console.log('BackgroundService.handleGetVaults -> Invalid payload');
            return false;
        }

        // -- se cerco per nome, ignoro url
        if (name && name !== "") {
            return await this.searchVaultsByName(name, totpOnly);
        }

        // -- altrimenti filtro per url
        const vaultsByUrl = await this.getVaultsByUrl(url);
        if (!vaultsByUrl) return false;

        // -- filtro solo totp se richiesto
        if (totpOnly) {
            return vaultsByUrl.filter(v => v.secrets?.O);
        }

        // -- limito risultati
        return vaultsByUrl.slice(0, this.maxResults);
    }
}   