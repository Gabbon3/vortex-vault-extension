class ContentService {
    constructor() {
        this.searchActive = false;
        this.targetInput = null;
        this.currentQuery = "";
        this.vaultSelector = null;
        this.debounceTimeout = null;
        this.maxResults = 5;
    }
    /**
     * Inizializzo gli eventi necessari al funzionamento del
     */
    init() {
        if (this.vaultSelector) return;
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        /**
         * Aggiungo il css
         */
        const style = document.createElement("style");
        style.textContent = `
  #vault-selector {
    position: absolute;
    display: none;
    flex-direction: column;
    z-index: 99999;
    background: #333;
    color: #aaa;
    border: 1px solid #888;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    font-family: sans-serif;
    font-size: 14px;
    max-width: 300px;
    min-width: 160px;
  }

  #vault-selector .vault-entry {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    color: #fff;
    cursor: pointer;
    width: 100%;
  }

  #vault-selector .vault-entry:hover {
    background-color: #444;
  }

  #vault-selector .vault-entry span {
    color: #aaa;
    font-size: 13px;
  }
`;
        document.head.appendChild(style);
        // ---
        // -- creo il componente vault selector
        this.vaultSelector = document.createElement("div");
        this.vaultSelector.id = "vault-selector";
        document.body.appendChild(this.vaultSelector);
        // -- aggiungo il listener delegator sulle entry dei vault per l'autocompletamento
        document.addEventListener("click", (event) => {
            const entry = event.target.closest("#vault-selector .vault-entry");
            if (!entry) return;
            // ---
            const vaultData = entry._vaultData;
            if (!vaultData) return;
            // ---
            this.handleVaultSelection(vaultData);
        });
    }

    /**
     * Gestisce la ricerca sull'input targettato
     * @param {Event} event 
     * @returns 
     */
    async handleKeyDown(event) {
        // -- toggle attivazione ricerca con Ctrl + ù
        if (event.ctrlKey && event.key === "ù") {
            event.preventDefault();
            this.searchActive = !this.searchActive;
            console.log(`[v] Search is ${this.searchActive ? 'active' : 'inactive'}`);
            // ---
            if (this.searchActive) {
                this.targetInput = document.activeElement;
                this.targetInput.addEventListener("blur", this.handleTargetBlur.bind(this));
                if (!this.targetInput || this.targetInput.tagName !== "INPUT" || this.targetInput.type === "password") {
                    this.searchActive = false;
                    return;
                }
                /**
                 * Debounce sulla ricerca dei vault
                 */
                clearTimeout(this.debounceTimeout);
                this.currentQuery = this.targetInput.value.trim();
                this.debounceTimeout = setTimeout(() => {
                    this.fetchVaults(this.currentQuery);
                }, 150);
            }
            // ---
            if (!this.searchActive) this.closeVaultSelector();
            return;
        }

        // -- se la ricerca è attiva, aggiorna la query
        if (this.searchActive && this.targetInput) {
            /**
             * Chiudi selettore con ESC
             */
            if (event.key === "Escape") {
                this.searchActive = false;
                this.closeVaultSelector();
                return;
            }
            /**
             * Autocompletamento primo risultato se premi Enter
             */
            if (event.ctrlKey && event.key === "Enter") {
                const firstEntry = this.vaultSelector?.querySelector(".vault-entry");
                if (firstEntry && firstEntry._vaultData) {
                    this.handleVaultSelection(firstEntry._vaultData);
                }
                return;
            }
            /**
             * Normale ricerca
             */
            const isChar = event.key.length === 1 || event.key === "Backspace";
            // ---
            if (!isChar) return;
            // ---
            this.currentQuery = this.targetInput.value.trim();
            await this.fetchVaults(this.currentQuery);
        }

    }

    /**
     * Quando fa focus out, rimuove il selector
     */
    handleTargetBlur() {
        if (this.searchActive) {
            this.searchActive = false;
            this.closeVaultSelector();
        }
    }

    /**
     * Gestisce il click che viene fatto sui risultati della ricerca
     * si occupa quindi di effettuare l'autocompletamento
     * @param {Object} vault 
     */
    handleVaultSelection(vault) {
        if (!this.targetInput) return;
        // -- cerco il primo campo password dentro il form dove si trova l'input dello username
        const form = this.targetInput.closest("form");
        if (form) {
            const passwordInput = form.querySelector('input[type="password"]');
            if (passwordInput) {
                // -- inserisco lo username nell'input
                this.targetInput.value = vault.secrets.U;
                passwordInput.value = vault.secrets.P;
                this.searchActive = false;
            } else {
                navigator.clipboard.writeText(vault.secrets.P);
                alert('Not able to auto fill, password copied to clipboard');
            }
        }
        // -- chiudo la ricerca
        this.closeVaultSelector();
    }


    /**
     * Restituisce tutti i vault
     * @param {string} query query per ricercare i vault
     */
    async fetchVaults(query) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "get-vaults",
                payload: {
                    name: query
                }
            });
            // ---
            if (response.success && response.data instanceof Array) {
                this.showVaultSelector(this.targetInput, response.data);
            } else {
                this.closeVaultSelector();
            }
        } catch (err) {
            console.error("Errore nel recupero dei vault:", err);
        }
    }

    /**
     * Mostra il container e lo posiziona sotto l'input target
     * @param {HTMLElement} inputElement 
     * @param {*} vaultEntries 
     */
    showVaultSelector(inputElement, vaultEntries) {
        this.attachVaultSelectorTo(inputElement);
        this.vaultSelector.style.display = "flex";
        /**
         * se ci sono 0 risultati
         */
        if (vaultEntries.length === 0) {
            this.vaultSelector.innerHTML = "<span style='padding: 5px'>No vault, maybe you need to log in</span>";
            return;
        }
        /**
         * prendo i primi 5
         */
        this.vaultSelector.innerHTML = "";
        // ---
        vaultEntries.slice(0, this.maxResults).forEach(vault => {
            const entry = this.renderVaultEntry(vault);
            this.vaultSelector.appendChild(entry);
        });
    }
    /**
     * Chiude il contenitore
     */
    closeVaultSelector() {
        this.vaultSelector.style.display = "none";
        this.vaultSelector.innerHTML = ''; // opzionale: svuoti
        // -- rimuovo il listener per il focus out
        if (this.targetInput) {
            this.targetInput.removeEventListener("blur", this.handleTargetBlur);
        }
    }
    /**
     * Aggancia il vault selector all'input target
     * @param {HTMLElement} inputElement 
     */
    attachVaultSelectorTo(inputElement) {
        const rect = inputElement.getBoundingClientRect();
        this.vaultSelector.style.top = `${rect.bottom + window.scrollY + 4}px`;
        this.vaultSelector.style.left = `${rect.left + window.scrollX}px`;
        this.vaultSelector.style.width = `${rect.width}px`;
    }
    /**
     * Genera l'elemento html dell'entry da mostrare nei risultati
     * @param {Object} vault 
     * @returns {HTMLElement}
     */
    renderVaultEntry(vault) {
        const div = document.createElement("div");
        div.className = "vault-entry";
        div.innerHTML = `<strong>${vault.secrets.T ?? 'No title'}</strong><span>${vault.secrets.U ?? 'no username'}</span>`;
        div._vaultData = vault;
        return div;
    }
}

console.log('Vault Content Script Enabled');
const service = new ContentService();
service.init();