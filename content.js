import { TOTP } from "./core/secure/totp.js";
import { Bytes } from "./core/utils/bytes.js";

class ContentService {
    constructor() {
        this.searchActive = false;
        this.targetInput = null;
        this.currentQuery = "";
        this.vaultSelector = null;
        this.debounceTimeout = null;
        // per navigazione con frecce
        this.selectedIndex = 0;
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
  :root { --vve-hover-color: #444 }
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
    max-width: 400px;
    min-width: 200px;
    max-height: 350px;
    overflow-y: scroll;
    scrollbar-width: none;
  }

  #vault-selector::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  #vault-selector .vault-entry {
    display: flex;
    flex-direction: row;
    gap: 4px;
    padding: 8px 12px;
    color: #fff;
    cursor: pointer;
    width: 100%;
  }

  #vault-selector .vault-entry .vve-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  #vault-selector .vault-entry .vve-totp {
    margin-left: auto;
    background-color: #444;
    color: #eee;
    border: 1px solid #555;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }

  #vault-selector .vault-entry:hover,
  #vault-selector .vault-entry.active {
    background-color: var(--vve-hover-color);
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
        document.addEventListener("click", async (event) => {
            /**
             * click su bottone OTP
             */
            const otpButton = event.target.closest(".vve-totp");
            if (otpButton) {
                const entry = otpButton.closest(".vault-entry");
                const vaultData = entry?._vaultData;
                if (vaultData?.secrets?.O) {
                    this.insertTotp(vaultData);
                }
                return;
            }
            /**
             * click normale su entry
             */
            const entry = event.target.closest("#vault-selector .vault-entry");
            if (!entry || event.target.classList.contains("vve-totp")) return;
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
        let totpOnly = event.ctrlKey && event.key === "ù" && event.altKey;
        const toggleSearch = event.ctrlKey && event.key === "ù";
        // -- toggle attivazione ricerca con Ctrl + ù
        if (totpOnly || toggleSearch) {
            event.preventDefault();
            this.searchActive = !this.searchActive;
            console.log(
                `[v] Search is ${this.searchActive ? "active" : "inactive"}`
            );
            // ---
            if (this.searchActive) {
                this.targetInput = document.activeElement;
                /**
                 * cerco l'input se il target è in realtà un web component
                 */
                if (this.targetInput && this.targetInput.shadowRoot) {
                    const innerInput = this.targetInput.shadowRoot.querySelector('input, textarea');
                    if (innerInput) {
                        this.targetInput = innerInput;
                    }
                }
                // ---
                if (
                    !this.targetInput ||
                    this.targetInput.tagName !== "INPUT" ||
                    this.targetInput.type === "password"
                ) {
                    this.searchActive = false;
                    return;
                }
                /**
                 * listener usato per chiudere il selettore se l'utente esce dall'input
                 */
                this.targetInput.addEventListener(
                    "blur",
                    this.handleTargetBlur.bind(this)
                );
                /**
                 * Debounce sulla ricerca dei vault
                 */
                clearTimeout(this.debounceTimeout);
                this.currentQuery = this.targetInput.value.trim();
                this.debounceTimeout = setTimeout(() => {
                    this.fetchVaults({ query: this.currentQuery, totpOnly });
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
                event.preventDefault();
                this.searchActive = false;
                this.closeVaultSelector();
                return;
            }
            /**
             * Frecce
             */
            if (this.searchActive && event.key === "ArrowUp") {
                event.preventDefault();
                this.moveSelection(-1);
                return;
            }
            if (this.searchActive && event.key === "ArrowDown") {
                event.preventDefault();
                this.moveSelection(1);
                return;
            }
            /**
             * Inserisco il vault se premo ctrl + i
             */
            if (event.ctrlKey && event.key === "i") {
                event.preventDefault();
                const selected = this.vaultSelector?.children[this.selectedIndex];
                if (!selected || !selected._vaultData) return;
                this.handleVaultSelection(selected._vaultData);
                return;
            }
            /**
             * Inserisco il totp
             */
            if (event.ctrlKey && event.key === "ò") {
                event.preventDefault();
                const selected = this.vaultSelector?.children[this.selectedIndex];
                if (!selected || !selected._vaultData) return;
                this.insertTotp(selected._vaultData);
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
            await this.fetchVaults({ query: this.currentQuery });
        }
    }

    /**
     * Sposta il selettore con le freccie
     * @param {number} direction +- 1
     */
    moveSelection(direction) {
        // -- verifico che ci siano elementi
        const entries = this.vaultSelector?.children;
        if (!entries || entries.length === 0) return;
        // -- rimuovo l'attuale selezione
        entries[this.selectedIndex]?.classList.remove("active");
        // -- calcolo la posizione successiva
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) this.selectedIndex = entries.length - 1;
        if (this.selectedIndex >= entries.length) this.selectedIndex = 0;
        // -- aggiungo active all'elemento target
        entries[this.selectedIndex]?.classList.add("active");
    }

    /**
     * Quando fa focus out, rimuove il selector
     */
    handleTargetBlur() {
        if (this.searchActive) {
            setTimeout(() => {
                this.searchActive = false;
                this.closeVaultSelector();
            }, 500);
        }
    }

    /**
     * Gestisce il click che viene fatto sui risultati della ricerca
     * si occupa quindi di effettuare l'autocompletamento
     * @param {Object} vault
     */
    handleVaultSelection(vault) {
        if (!this.targetInput) return;
        // -- inserisco lo username nell'input
        this.smartFillInput(this.targetInput, vault.secrets.U);
        let passwordInput = null;

        // 1. provo a trovare il campo password tramite il form
        const form = this.targetInput.closest("form");
        if (form) {
            passwordInput = form.querySelector('input[type="password"]');
        }

        // 2. se non c’è form, cerco altri input nelle vicinanze
        if (!passwordInput) {
            const passwordInputs = [
                ...document.querySelectorAll('input[type="password"]'),
            ];
            passwordInput = this.findNearest(passwordInputs);
        }

        // 3. se non ce nemmeno un input password, cerco nei shadow root (sei stronzo)
        if (!passwordInput) {
            const shadowInputs = [
                ...Array.from(document.querySelectorAll('*'))
                    .filter(el => el.shadowRoot)
                    .map(el => el.shadowRoot.querySelector('input[type="password"]'))
                    .filter(Boolean)
            ];
            passwordInput = this.findNearest(shadowInputs);
        }

        // 4. se l’abbiamo trovato -> autofill
        if (passwordInput) {
            this.smartFillInput(passwordInput, vault.secrets.P);
            this.searchActive = false;
        } else {
            // sei stronzo a tuono -> copio la password
            navigator.clipboard.writeText(vault.secrets.P);
            alert("Not able to auto fill, password copied to clipboard");
        }

        // 5. chiudo il selettore
        this.closeVaultSelector();
    }

    /**
     * Restituisce il primo elemento più vicino rispetto ad un altro
     * @param {Array<HTMLElement>} inputList 
     * @param {HTMLElement} target 
     * @param {number} targetDistance 
     * @returns {HTMLElement}
     */
    findNearest(inputList, target = this.targetInput, targetDistance = 150) {
        return inputList.find((input) => {
            const rect1 = target.getBoundingClientRect();
            const rect2 = input.getBoundingClientRect();
            const distance = Math.abs(rect1.top - rect2.top);
            return distance < targetDistance;
        });
    }

    /**
     * Tenta di fillare un input, tenendo conto di React o altre cazzate da web moderno
     * @param {HTMLElement} input
     * @param {string} value
     */
    smartFillInput(input, value) {
        if (!input) return;
        // ---
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;
        // ---
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value);
        } else {
            input.value = value; // fallback
        }
        // -- trigghero tutti gli eventi sensati per far felici React, Angular, Vue ecc.
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    /**
     * Inserisce il codice totp
     * @param {Object} vaultData 
     */
    async insertTotp(vaultData) {
        const _totp = new TOTP();
        const secretDecoded = Bytes.base32.decode(vaultData.secrets.O);
        // ---
        const otp = await _totp.code(secretDecoded);
        if (otp && this.targetInput) {
            this.smartFillInput(this.targetInput, otp);
            this.closeVaultSelector();
        }
    }

    /**
     * Restituisce tutti i vault
     * @param {string} query query per ricercare i vault
     * @param {boolean} totpOnly se true restituisce solo le entry con codice totp
     */
    async fetchVaults({ query, totpOnly = false }) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "get-vaults",
                payload: {
                    name: query,
                    totpOnly,
                },
            });
            // ---
            if (response.success && response.data instanceof Array) {
                this.showVaultSelector(
                    this.targetInput,
                    response.data,
                    totpOnly
                );
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
     * @param {Array} vaultEntries
     * @param {boolean} totpOnly
     */
    showVaultSelector(inputElement, vaultEntries, totpOnly = false) {
        this.attachVaultSelectorTo(inputElement);
        this.vaultSelector.style.display = "flex";
        /**
         * se ci sono 0 risultati
         */
        if (vaultEntries.length === 0) {
            this.vaultSelector.innerHTML =
                "<span style='padding: 5px'>No vault, maybe you need to log in</span>";
            return;
        }
        /**
         * Inizializzo l'html e la selezione del vault
         */
        this.vaultSelector.innerHTML = "";
        this.selectedIndex = 0;
        // ---
        vaultEntries.forEach((vault) => {
            const entry = this.renderVaultEntry(vault);
            this.vaultSelector.appendChild(entry);
        });
        // -- aggiungo classe active al primo elementi se esiste
        if (this.vaultSelector.children[0]) {
            this.vaultSelector.children[0].classList.add("active");
        }
    }
    /**
     * Chiude il contenitore
     */
    closeVaultSelector() {
        this.vaultSelector.style.display = "none";
        this.vaultSelector.innerHTML = ""; // opzionale: svuoti
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
        div.innerHTML = `<div class="vve-info"><strong>${vault.secrets.T ?? "No title"
            }</strong><span>${vault.secrets.U ?? "no username"}</span></div>
        ${!!vault.secrets.O
                ? '<button class="vve-totp" title="Insert TOTP code">TOTP</button>'
                : ""
            }`;
        div._vaultData = vault;
        return div;
    }
}

console.log("Vault Content Script Enabled");
const service = new ContentService();
service.init();
