import { TOTP } from "./core/secure/totp.js";
import { Bytes } from "./core/utils/bytes.js";
import { Sliders } from "./lib/sliders.js";

class ContentService {
    constructor() {
        this.searchActive = false;
        this.targetInput = null;
        this.isPasswordInput = false;
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
  :root { 
    --vve-color-1: #a8af74; 
    --vve-text-1: #fff; 
    --vve-text-2: #aaa; 
    --vve-color-2: #3f3e32; 
    --vve-1: #171414; 
    --vve-2: #1f1b1b; 
    --vve-3: #272222;
    --vve-4: #302929;
    --vve-border-color: #555;
  }
  .vve-light {
    --vve-color-1: #738e54; 
    --vve-text-1: #111;
    --vve-text-2: #555;
    --vve-1: #fff; 
    --vve-2: #f5f5f5; 
    --vve-3: #eee;
    --vve-4: #ddd;
    --vve-border-color: #ddd;
  }

  #vault-selector {
    position: absolute;
    display: flex;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
    flex-direction: column;
    z-index: 99999;
    background: var(--vve-1);
    border: 1px solid var(--vve-border-color);
    box-shadow: 0 0 2px 0 var(--vve-border-color);
    color: var(--vve-text-2);
    overflow: hidden;
    font-family: sans-serif;
    font-size: 14px;
    max-width: 400px;
    min-width: 325px;
    overflow-y: scroll;
    scrollbar-width: none;
    font-family: monospace !important;
  }

  #vault-selector * { font-family: monospace !important; }

  #vault-selector::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  #vault-selector .vault-entry {
    display: flex;
    flex-direction: row;
    gap: 5px;
    padding: 8px;
    border-radius: 8px;
    background-color: var(--vve-2);
    color: var(--vve-text-1) !important;
    cursor: pointer;
    width: 100%;
    border: 1px solid transparent;
    transition: 0.1s;
  }

  #vault-selector .vault-entry .vve-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  #vault-selector .vault-entry .vve-totp {
    margin-left: auto;
    background-color: var(--vve-3);
    color: var(--vve-text-1);
    border: 1px solid var(--border-color);
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }

  .vve-ctrl-info-cont {
    display: flex;
    direction: row;
    flex-wrap: wrap;
    gap: 5px;
  }

  .vve-ctrl-info {
    background-color: var(--vve-4);
    color: var(--vve-text-2);
    border-radius: 20px;
    padding: 3px 8px;
    text-align: center;
  }

  .vve-mla { margin-left: auto }

  #vault-selector .vault-entry:hover,
  #vault-selector .vault-entry.active {
    background-color: var(--vve-3);
    border: 1px solid var(--vve-border-color);
    transition: 0.1s;
  }

  #vault-selector .vault-entry span {
    color: var(--vve-text-2);
    font-size: 13px;
  }

  #vault-selector .vault-entry strong {
    font-weight: bold;
  }

  .vve-mpy-0 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .vve-slider-cont {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease, opacity 0.3s ease;

  }
  .vve-slider-cont.fast {
      transition-duration: 0.25s;
  }
  .vve-slider-cont.slow {
      transition-duration: 0.35s;
  }
  .vve-slider-cont.slower {
      transition-duration: 0.4s;
  }
  .vve-slider-cont.slider-open {
      opacity: 1;
  }
`;
        document.head.appendChild(style);
        // ---
        // -- creo il componente vault selector
        this.vaultSelector = document.createElement("div");
        this.vaultSelector.id = "vault-selector";
        this.vaultSelector.className = "vve-slider-cont";
        this.vaultSelector.dataset.maxHeight = "400";
        /**
         * verifico se la pagina è a tema scuro o chiaro
         */
        const isDark = this.detectTheme();
        if (!isDark) {
            this.vaultSelector.classList.add('vve-light');
        }
        document.body.appendChild(this.vaultSelector);
        Sliders.init();
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
     * Rileva il tema della pagina in cui si trova il content script
     * @returns {boolean} true se il tema è scuro, false se è chiaro
     */
    detectTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        try {
            const bgLuminance = this.getBackgroundLuminance();
            const isActuallyDark = bgLuminance < 128;
            return isActuallyDark;
        } catch {
            return prefersDark;
        }
    }

    /**
     * Restituisce il valore di illuminazione del background, 
     * piu è basso più il tema potrebbe essere scuro
     * @returns {number}
     */
    getBackgroundLuminance() {
        const el = document.body;
        const style = getComputedStyle(el);
        const bg = style.backgroundColor;
        // -- esempio: "rgb(34, 34, 34)"
        const rgb = bg.match(/\d+/g).map(Number);
        const [r, g, b] = rgb;
        // -- calcolo luminanza secondo WCAG
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance;
    }

    /**
     * Gestisce la ricerca sull'input targettato
     * @param {Event} event
     * @returns
     */
    async handleKeyDown(event) {
        let totpOnly = event.ctrlKey && event.key === "ù" && event.altKey;
        const toggleSearch = event.ctrlKey && event.key === "ù";
        // -- toggle attivazione ricerca con Ctrl + x
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
                /**
                 * Memorizzo se si tratta di un input password
                 */
                this.isPasswordInput = this.targetInput.type === "password";
                // ---
                if (
                    !this.targetInput ||
                    this.targetInput.tagName !== "INPUT"
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
                // ---
                this.fetchVaults({ query: "", totpOnly });
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
             * Inserisco il vault se premo ctrl + enter
             */
            if (event.ctrlKey && !event.altKey && event.key === "Enter") {
                event.preventDefault();
                const selected = this.vaultSelector?.children[this.selectedIndex];
                if (!selected || !selected._vaultData) return;
                this.handleVaultSelection(selected._vaultData);
                return;
            }
            /**
             * Inserisco il totp se premo ctrl + alt + Enter
             */
            if (event.ctrlKey && event.altKey && event.key === "Enter") {
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
            /**
             * Debounce sulla ricerca dei vault
             */
            clearTimeout(this.debounceTimeout);
            this.currentQuery = this.targetInput.value.trim();
            this.debounceTimeout = setTimeout(() => {
                this.fetchVaults({ query: this.currentQuery, totpOnly });
            }, 150);
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
        if (this.selectedIndex < 0) this.selectedIndex = entries.length - 2;
        if (this.selectedIndex >= entries.length - 1) this.selectedIndex = 0;
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
        /**
         * Se è un input di tipo password inserisco solo la password
         */
        if (this.isPasswordInput) {
            this.smartFillInput(this.targetInput, vault.secrets.P);
            this.closeVaultSelector();
            return;
        }
        /**
         * Normale uso dell'input
         */
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
            // rimosso per evitare clipboard scraping
            // sei stronzo a tuono
            // navigator.clipboard.writeText(vault.secrets.P);
            // alert("Not able to auto fill, password copied to clipboard");
        }

        // 5. chiudo il selettore
        this.closeVaultSelector();
    }

    /**
     * Restituisce il primo elemento più vicino rispetto ad un altro
     * @param {Array<HTMLElement>} inputList 
     * @param {HTMLElement} target 
     * @param {number} maxDistance distanza massima considerata in px (default 150)
     * @returns {HTMLElement|null}
     */
    findNearest(inputList, target = this.targetInput, maxDistance = 150) {
        if (!inputList.length || !target) return null;

        let nearest = null;
        let minDistance = maxDistance;

        const rectTarget = target.getBoundingClientRect();

        inputList.forEach(input => {
            const rect = input.getBoundingClientRect();

            // -- distanza euclidea approssimata solo su X e Y √[(x₂ - x₁)² + (y₂ - y₁)²]
            const dx = rect.left - rectTarget.left;
            const dy = rect.top - rectTarget.top;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                nearest = input;
                minDistance = distance;
            }
        });

        return nearest;
    }

    /**
     * Tenta di fillare un input, tenendo conto di React o altre cazzate da web moderno
     * @param {HTMLElement} input
     * @param {string} value
     */
    smartFillInput(input, value) {
        if (!input) return;
        // -- verifico se l'input è visibile
        if (!this.isVisible(input)) return alert("Attenzione stai tentando di compilare dei campi non visibili, procedi con cautela");
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
                    url: new URL(window.location.href).origin,
                    totpOnly,
                },
            });
            // ---
            if (response.success && (response.data instanceof Array || response.data === false)) {
                this.showVaultSelector(
                    this.targetInput,
                    response.data,
                    totpOnly
                );
                Sliders.manageSlider(this.vaultSelector, { forceOpen: true });
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
        // this.vaultSelector.style.display = "flex";
        /**
         * se ci sono 0 risultati
         */
        if (vaultEntries === false) {
            this.vaultSelector.innerHTML = "<span style='padding: 5px'>Vault is not ready, please open extension popup.</span>";
            return;
        }
        else if (vaultEntries.length === 0) {
            this.vaultSelector.innerHTML =
                "<span style='padding: 5px'>No vaults matched this query</span>";
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
        // -- aggiungo le informazioni al fondo per autocompilare
        const ctrlInfo = document.createElement('div');
        ctrlInfo.classList.add('vve-ctrl-info-cont');
        ctrlInfo.innerHTML =
            `<span class="vve-ctrl-info" title="Auto-complete with active credentials">Ctrl + Enter</span><span class="vve-ctrl-info vve-mla" title="Insert TOTP of active credentials">Ctrl + Alt + Enter</span>`;
        this.vaultSelector.appendChild(ctrlInfo);
    }
    /**
     * Chiude il contenitore
     */
    closeVaultSelector() {
        // this.vaultSelector.style.display = "none";
        Sliders.manageSlider(this.vaultSelector, { forceClose: true });
        // -- rimuovo il listener per il focus out
        if (this.targetInput) {
            this.targetInput.removeEventListener("blur", this.handleTargetBlur);
        }
        setTimeout(() => {
            this.vaultSelector.innerHTML = ""; // opzionale: svuoti
        }, 500);
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
        div.innerHTML =
            `<div class="vve-info"><strong>${vault.secrets.T ?? "No title"}</strong>
        <span>${vault.secrets.U ?? "no username"}</span></div>
        ${!!vault.secrets.O
                ? '<button class="vve-totp" title="Insert TOTP code">TOTP</button>'
                : ""
            }`;
        div._vaultData = vault;
        return div;
    }
    /**
     * Verifica se un input è effettivamente visibile e quindi sicuro da compilare
     * @param {HTMLElement} el elemento html
     * @returns {boolean} true se è visibile
     */
    isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        // -- controllo il css
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        const rect = el.getBoundingClientRect();
        // --- deve avere delle dimensioni
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }
        // -- deve essere visibile all'interno del viewport
        const inViewport = (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth)
        );
        if (!inViewport) {
            return false;
        }
        // --  se passa tutto tecnicamente è un input valido
        return true;
    }
}

console.log("Vault Content Script Enabled");
const service = new ContentService();
service.init();
