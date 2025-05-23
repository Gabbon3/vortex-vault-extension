class VaultSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Stile base
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: absolute;
          z-index: 999999;
          background: white;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          font-family: sans-serif;
          font-size: 14px;
          max-width: 300px;
          min-width: 160px;
        }
        .entry {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .entry:last-child {
          border-bottom: none;
        }
        .entry:hover {
          background-color: #f0f0f0;
        }
      </style>
      <div id="container"></div>
    `;
    }

    /**
     * Aggiorna le entry html
     * @param {Array} vaults 
     */
    update(vaults) {
        const container = this.shadowRoot.getElementById('container');
        container.innerHTML = '';
        // -- mostro solo i primi 3 risultati
        const sliced = vaults.slice(0, 3);
        // ---
        for (const vault of sliced) {
            const div = document.createElement('div');
            div.className = 'entry';
            div.textContent = vault.secrets.T || '(Senza titolo)';
            div.id = vault.id;
            div._vaultData = vault.secrets;
            container.appendChild(div);
        }
    }

    /**
     * Modifica le coordinate del componente per farlo mettere sotto i target
     * @param {HTMLElement} inputElement 
     */
    attachTo(inputElement) {
        const rect = inputElement.getBoundingClientRect();
        this.style.top = `${rect.bottom + window.scrollY + 4}px`;
        this.style.left = `${rect.left + window.scrollX}px`;
        this.style.width = `${rect.width}px`;
    }
}

// customElements.define('vault-selector', VaultSelector);