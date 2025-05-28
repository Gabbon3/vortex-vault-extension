(() => {
  // core/utils/bytes.js
  var Bytes = class _Bytes {
    static base64 = {
      /**
       * Converte una stringa base64 in un Uint8Array
       * @param {string} base64
       * @returns {Uint8Array}
       */
      decode(base64, urlsafe = false) {
        if (urlsafe) {
          base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
          base64 = base64.padEnd(
            base64.length + (4 - base64.length % 4) % 4,
            "="
          );
        }
        const binaryString = self.atob(base64);
        return Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
      },
      /**
       * Converte un Uint8Array in una stringa base64
       * @param {Uint8Array} buffer
       * @returns {string}
       */
      encode(buffer, urlsafe = false) {
        const base64 = self.btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return urlsafe ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : base64;
      }
    };
    static base32 = {
      /**
       * Converte una stringa in base32 in un array di byte
       * @param {string} base32String
       * @returns {Uint8Array}
       */
      decode(base32String) {
        const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        const output = [];
        let buffer = 0;
        let bitsInBuffer = 0;
        for (const char of base32String) {
          const index = base32Alphabet.indexOf(char);
          if (index === -1) continue;
          buffer = buffer << 5 | index;
          bitsInBuffer += 5;
          if (bitsInBuffer >= 8) {
            output.push(buffer >> bitsInBuffer - 8 & 255);
            bitsInBuffer -= 8;
          }
        }
        return new Uint8Array(output);
      },
      /**
       * Converte i byte in una stringa in base32
       * @param {Uint8Array} uint8Array
       * @returns
       */
      encode(uint8Array) {
        const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let output = "";
        let buffer = 0;
        let bitsInBuffer = 0;
        for (const byte of uint8Array) {
          buffer = buffer << 8 | byte;
          bitsInBuffer += 8;
          while (bitsInBuffer >= 5) {
            output += base32Alphabet[buffer >> bitsInBuffer - 5 & 31];
            bitsInBuffer -= 5;
          }
        }
        if (bitsInBuffer > 0) {
          output += base32Alphabet[buffer << 5 - bitsInBuffer & 31];
        }
        return output;
      }
    };
    static hex = {
      /**
       * Converte una stringa esadecimale in una stringa di testo
       * @param {string} hex_string
       * @returns
       */
      _hex(hex_string) {
        return hex_string.match(/.{1,2}/g).map((byte) => String.fromCharCode(parseInt(byte, 16))).join("");
      },
      /**
       * Converte una stringa di testo in una stringa esadecimale
       * @param {string} text
       * @returns {string}
       */
      hex_(text) {
        return Array.from(text).map((char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
      },
      /**
       * Converte una stringa esadecimale in un Uint8Array
       * @param {string} hex
       * @returns {Uint8Array}
       */
      decode(hex) {
        hex = hex.replace(/\s+/g, "").toLowerCase();
        if (hex.length % 2 !== 0) {
          throw new Error("Hex string must have an even length");
        }
        const length = hex.length / 2;
        const array = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          array[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return array;
      },
      /**
       * Converte un Uint8Array in una stringa esadecimale
       * @param {string} array
       * @returns {string}
       */
      encode(array) {
        return Array.from(array).map((byte) => byte.toString(16).padStart(2, "0")).join("");
      }
    };
    static txt = {
      /**
       * Converte una stringa di testo in un Uint8Array
       * @param {string} txt
       * @returns {Uint8Array}
       */
      from(txt) {
        return new TextEncoder().encode(txt);
      },
      /**
       * Converte un Uint8Array in una stringa di testo
       * @param {Uint8Array} buffer
       * @returns {string}
       */
      to(buffer) {
        return new TextDecoder().decode(buffer);
      },
      /**
       * Converte una stringa di testo in base64
       * @param {String} txt
       */
      base64_(txt) {
        const B = new TextEncoder().encode(txt);
        return Buffer.base64._bytes(B);
      },
      /**
       * Converte una stringa base64 in testo
       * @param {String} base64
       */
      _base64(base64) {
        const txt = Buffer.base64.bytes_(base64);
        return new TextDecoder().decode(txt);
      },
      /**
       * Converte del testo in un Uint16Array
       * @param {String} txt
       * @returns
       */
      Uint16_(txt) {
        let B = typeof txt === "string" ? this.bytes_(txt) : txt;
        const length = B.length;
        const padded_length = length + length % 2;
        const U16 = new Uint16Array(padded_length / 2);
        for (let i = 0; i < length; i += 2) {
          U16[i / 2] = (B[i] | B[i + 1] << 8) >>> 0;
        }
        return U16;
      }
    };
    static bigint = {
      /**
       * Converte un BigInt in un Uint8Array
       * @param {BigInt} n
       * @returns {Uint8Array}
       */
      decode(n) {
        const L = Math.ceil(n.toString(2).length / 8);
        const B = new Uint8Array(L);
        for (let i = 0; i < L; i++) {
          B[i] = Number(n & 255n);
          n >>= 8n;
        }
        return B.reverse();
      },
      /**
       * Converte un Uint8Array in un BigInt
       * @param {Uint8Array} buffer 
       * @returns {BigInt}
       */
      encode(byte) {
        let n = 0n;
        const L = byte.length;
        for (let i = 0; i < L; i++) {
          n = n << 8n | BigInt(byte[i]);
        }
        return n;
      }
    };
    static pem = {
      /**
       * Converte dei dati binari rappresentati una chiave pubblica o privata in formato pem
       * @param {Uint8Array|ArrayBuffer} blob 
       * @returns 
       */
      encode(blob, label) {
        const base64 = _Bytes.base64.encode(blob);
        return `-----BEGIN ${label}-----
${base64}
-----END ${label}-----`;
      }
    };
    /**
     * Unisce n Uint8Array in un unico Uint8Array
     * @param {ArrayBuffer} buffers
     * @param {number} size
     * @returns
     */
    static merge(buffers, size) {
      let length = 0;
      for (const buffer of buffers) {
        length += buffer.length;
      }
      let merged_array;
      switch (size) {
        case 8:
          merged_array = new Uint8Array(length);
          break;
        case 16:
          merged_array = new Uint16Array(length);
          break;
        case 32:
          merged_array = new Uint32Array(length);
          break;
        default:
          throw new Error("Invalid size");
      }
      let offset = 0;
      for (const buffer of buffers) {
        merged_array.set(buffer, offset);
        offset += buffer.length;
      }
      return merged_array;
    }
    /**
     * Compara due Buffer verificando se sono uguali, utilizza il metodo constant time compare per limitare timing attacks
     * @param {Array} a
     * @param {Array} b
     * @returns
     */
    static compare(a, b) {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    }
  };

  // core/secure/cripto.js
  var Cripto = class {
    /**
     * Utility per la codifica in output
     * @param {Uint8Array} bytes 
     * @param {string} encoding hex, base64, base64url, base32
     * @returns 
     */
    static encoding(bytes, encoding) {
      switch (encoding) {
        case "hex":
          return Bytes.hex.encode(bytes);
        case "base64":
          return Bytes.base64.encode(bytes);
        case "base62":
          return Bytes.base62.encode(bytes);
        case "base64url":
          return Bytes.base64.encode(bytes, true);
        case "base32":
          return Bytes.base32.encode(bytes);
        default:
          return bytes;
      }
    }
    /**
     * Genera una serie di byte casuali crittograficamente sicuri.
     * @param {number} size - Numero di byte da generare casualmente.
     * @param {string} [encoding=null] - Formato dell'output (optional: 'hex' o 'base64').
     * @returns {string|Uint8Array} - Byte generati nel formato specificato.
     */
    static random_bytes(size, encoding = null) {
      const bytes = self.crypto.getRandomValues(new Uint8Array(size));
      return this.encoding(bytes, encoding);
    }
    /**
     * Generate a high-entropy random number.
     * A secure replacement for Math.random().
     * @returns {number} A number in the range [0, 1).
     */
    static random_ratio() {
      const random_word = self.crypto.getRandomValues(new Uint32Array(1))[0];
      return random_word / 4294967296;
    }
    /**
     * Genera un codice di recupero crittograficamente sicuro
     * @param {number} size 
     * @returns {string}
     */
    static random_alphanumeric_code(size = 20, divisor = "-") {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
      let recovery_code = "";
      for (let i = 0; i < size; i++) {
        recovery_code += chars[Math.floor(this.random_ratio() * chars.length)];
      }
      return divisor ? recovery_code.match(/.{1,4}/g).join(divisor) : recovery_code;
    }
    /**
     * Genera un hash HMAC di un messaggio con una chiave specifica.
     * @param {string | Uint8Array} message - Messaggio da crittografare.
     * @param {Uint8Array} key - Chiave segreta per l'HMAC.
     * @param {Object} [options={}] - Opzioni per configurare l'HMAC.
     * @param {string} [options.key_encoding] - Encoding della chiave (es: 'hex' o 'base64').
     * @param {string} [options.algo='SHA-256'] - Algoritmo di hash da usare per l'HMAC.
     * @param {string} [options.encoding='hex'] - Encoding per l'output HMAC, default 'hex'.
     * @returns {Promise<string|Uint8Array>} - HMAC del messaggio in formato specificato.
     */
    static async hmac(message, key, options = {}) {
      const message_bytes = message instanceof Uint8Array ? message : new TextEncoder().encode(message);
      const crypto_key = await self.crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: { name: options.algo || "SHA-256" } },
        false,
        ["sign"]
      );
      const hmac_buffer = await self.crypto.subtle.sign("HMAC", crypto_key, message_bytes);
      return this.encoding(new Uint8Array(hmac_buffer), options.encoding);
    }
    /**
     * Calcola l'hash di un messaggio.
     * @param {string | Uint8Array} message - Messaggio da hashare.
     * @param {Object} [options={}] - Opzioni per configurare l'hash.
     * @param {string} [options.algorithm='SHA-256'] - Algoritmo di hash da usare (es: 'SHA-256').
     * @param {string} [options.encoding='hex'] - Encoding per l'output hash, default 'hex'.
     * @returns {Promise<string|Uint8Array>} - Hash del messaggio in formato specificato.
     */
    static async hash(message, options = {}) {
      const hashBuffer = await self.crypto.subtle.digest(
        { name: options.algorithm || "SHA-256" },
        message instanceof Uint8Array ? message : new TextEncoder().encode(message)
      );
      return this.encoding(new Uint8Array(hashBuffer), options.encoding);
    }
    /**
     * Deriva una chiave sfruttando l'algoritmo HKDF
     * @param {Uint8Array} ikm - input key material
     * @param {Uint8Array} salt -
     * @param {Uint8Array} additionalInfo -  
     * @param {number} keyLen 
     * @returns {Uint8Array}
     */
    static async HKDF(ikm, salt, additionalInfo = new Uint8Array(), keyLen = 256) {
      const hkdf = await self.crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveKey"]);
      const key = await self.crypto.subtle.deriveKey(
        {
          name: "HKDF",
          salt,
          info: additionalInfo,
          hash: "SHA-256"
        },
        hkdf,
        { name: "AES-GCM", length: keyLen },
        true,
        ["encrypt", "decrypt"]
      );
      return new Uint8Array(await self.crypto.subtle.exportKey("raw", key));
    }
    /**
     * Deriva una chiave crittografica da una password usando PBKDF2.
     * @param {string | Uint8Array} password - La password da usare per derivare la chiave.
     * @param {Uint8Array} salt - Il sale utilizzato nel processo di derivazione.
     * @param {number} [iterations=100000] - Il numero di iterazioni da eseguire.
     * @param {number} [keyLength=32] - La lunghezza della chiave derivata in byte.
     * @returns {Promise<Uint8Array>} - La chiave derivata.
     */
    static async deriveKey(password, salt, iterations = 1e5, keyLength = 32) {
      const passwordBuffer = password instanceof Uint8Array ? password : new TextEncoder().encode(password);
      const derivedKey = await self.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );
      const key = await self.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations,
          hash: "SHA-256"
        },
        derivedKey,
        { name: "AES-GCM", length: keyLength * 8 },
        // AES key length in bits
        true,
        ["encrypt", "decrypt"]
      );
      return new Uint8Array(await self.crypto.subtle.exportKey("raw", key));
    }
    /**
     * Tronca un UInt8Array
     * @param {Uint8Array} buf 
     * @param {number} length 
     * @param {string} mode "start": keeps the first N bytes, "end": keeps the last N bytes, "middle": keeps the center part, "smart": keeps start and end, drops the middle
     * @returns {Uint8Array}
     */
    static truncateBuffer(buf, length, mode = "start") {
      if (!(buf instanceof Uint8Array)) {
        throw new TypeError("Expected a Uint8Array");
      }
      if (length >= buf.length) return buf;
      switch (mode) {
        case "start":
          return buf.slice(0, length);
        case "end":
          return buf.slice(buf.length - length);
        case "middle": {
          const start = Math.floor((buf.length - length) / 2);
          return buf.slice(start, start + length);
        }
        case "smart": {
          const half = Math.floor(length / 2);
          const startPart = buf.slice(0, half);
          const endPart = buf.slice(buf.length - (length - half));
          const combined = new Uint8Array(length);
          combined.set(startPart);
          combined.set(endPart, half);
          return combined;
        }
        default:
          throw new Error(`Unknown truncation mode: ${mode}`);
      }
    }
    /**
     * Genera una coppia di chiavi asimmetriche in formato PEM in base al tipo di chiave e alla lunghezza.
     * Supporta RSA, ECDSA ed ED25519.
     * 
     * @param {string} key_type - Il tipo di chiave da generare. Può essere 'RSA', 'ECDSA', 'ED25519'.
     * @param {number} [key_length=2048] - La lunghezza della chiave, utilizzato solo per RSA (es. 2048, 4096). Ignorato per ECDSA e ED25519.
     * @returns {Promise<Object>} - Oggetto contenente la chiave privata e la chiave pubblica in formato PEM.
     * @throws {Error} - Se il tipo di chiave non è supportato o c'è un errore nella generazione.
     */
    static async generate_key_pair(key_type, key_length = 2048, as_pem = false) {
      let algorithm;
      switch (key_type) {
        case "RSA":
          algorithm = {
            name: "RSA-OAEP",
            modulusLength: key_length,
            // RSA 2048 o 4096
            publicExponent: new Uint8Array([1, 0, 1]),
            // 65537
            hash: { name: "SHA-256" }
          };
          break;
        case "ECDSA":
          algorithm = {
            name: "ECDSA",
            namedCurve: "P-256"
            // Può essere cambiato a P-384 o P-521
          };
          break;
        default:
          return -1;
      }
      try {
        const usages = key_type === "RSA" ? ["encrypt", "decrypt"] : ["sign", "verify"];
        const key_pair = await self.crypto.subtle.generateKey(
          algorithm,
          true,
          // Le chiavi possono essere esportate
          usages
          // Le operazioni per RSA, ECDSA e ED25519
        );
        const public_key = await self.crypto.subtle.exportKey("spki", key_pair.publicKey);
        const private_key = await self.crypto.subtle.exportKey("pkcs8", key_pair.privateKey);
        return {
          public: as_pem ? Bytes.pem.encode(public_key, "PUBLIC KEY") : public_key,
          private: as_pem ? Bytes.pem.encode(private_key, "PRIVATE KEY") : private_key
        };
      } catch (error) {
        console.warn("Error generating key pair", error);
        throw new Error("Error generating key pair");
      }
    }
  };

  // core/secure/totp.js
  var TOTP = class {
    /**
     * Genera un codice da un segreto
     * @param {Uint8Array} secret 
     * @param {number} [interval=30] 
     * @param {number} [shift=0] indice per calcolare segreti di altri momenti nel tempo
     * @returns {string}
     */
    async code(secret, interval = 30, shift = 0) {
      let time = Math.floor((Date.now() / 1e3 + shift * interval) / interval);
      const time_bytes = new Uint8Array(8);
      for (let i = 7; i >= 0; i--) {
        time_bytes[i] = time & 255;
        time >>= 8;
      }
      const hmac = await Cripto.hmac(time_bytes, secret, { algo: "SHA-1" });
      const offset = hmac[19] & 15;
      const code = ((hmac[offset] & 127) << 24 | // ottengo i 7 bit piu significativi
      (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255) % 1e6;
      return code.toString().padStart(6, "0");
    }
  };

  // content.js
  var ContentService = class {
    constructor() {
      this.searchActive = false;
      this.targetInput = null;
      this.isPasswordInput = false;
      this.currentQuery = "";
      this.vaultSelector = null;
      this.debounceTimeout = null;
      this.selectedIndex = 0;
    }
    /**
     * Inizializzo gli eventi necessari al funzionamento del
     */
    init() {
      if (this.vaultSelector) return;
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      const style = document.createElement("style");
      style.textContent = `
  :root { --vve-1: #171414; --vve-2: #1f1b1b; --vve-3: #272222 }
  #vault-selector {
    position: absolute;
    display: none;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
    flex-direction: column;
    z-index: 99999;
    background: var(--vve-1);
    border: 2px solid var(--vve-3);
    box-shadow: 0 0 2px 0 var(--vve-1);
    color: #aaa;
    overflow: hidden;
    font-family: sans-serif;
    font-size: 14px;
    max-width: 400px;
    min-width: 250px;
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
    gap: 5px;
    padding: 8px;
    border-radius: 8px;
    background-color: var(--vve-2);
    color: #eee !important;
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
    background-color: var(--vve-3);
    color: #eee;
    border: 1px solid #555;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }

  #vault-selector .vault-entry:hover,
  #vault-selector .vault-entry.active {
    background-color: var(--vve-3);
  }

  #vault-selector .vault-entry span {
    color: #aaa;
    font-size: 13px;
  }
`;
      document.head.appendChild(style);
      this.vaultSelector = document.createElement("div");
      this.vaultSelector.id = "vault-selector";
      document.body.appendChild(this.vaultSelector);
      document.addEventListener("click", async (event) => {
        const otpButton = event.target.closest(".vve-totp");
        if (otpButton) {
          const entry2 = otpButton.closest(".vault-entry");
          const vaultData2 = entry2?._vaultData;
          if (vaultData2?.secrets?.O) {
            this.insertTotp(vaultData2);
          }
          return;
        }
        const entry = event.target.closest("#vault-selector .vault-entry");
        if (!entry || event.target.classList.contains("vve-totp")) return;
        const vaultData = entry._vaultData;
        if (!vaultData) return;
        this.handleVaultSelection(vaultData);
      });
    }
    /**
     * Gestisce la ricerca sull'input targettato
     * @param {Event} event
     * @returns
     */
    async handleKeyDown(event) {
      let totpOnly = event.ctrlKey && event.key === "\xF9" && event.altKey;
      const toggleSearch = event.ctrlKey && event.key === "\xF9";
      if (totpOnly || toggleSearch) {
        event.preventDefault();
        this.searchActive = !this.searchActive;
        console.log(
          `[v] Search is ${this.searchActive ? "active" : "inactive"}`
        );
        if (this.searchActive) {
          this.targetInput = document.activeElement;
          if (this.targetInput && this.targetInput.shadowRoot) {
            const innerInput = this.targetInput.shadowRoot.querySelector("input, textarea");
            if (innerInput) {
              this.targetInput = innerInput;
            }
          }
          this.isPasswordInput = this.targetInput.type === "password";
          if (!this.targetInput || this.targetInput.tagName !== "INPUT") {
            this.searchActive = false;
            return;
          }
          this.targetInput.addEventListener(
            "blur",
            this.handleTargetBlur.bind(this)
          );
          clearTimeout(this.debounceTimeout);
          this.currentQuery = this.targetInput.value.trim();
          this.debounceTimeout = setTimeout(() => {
            this.fetchVaults({ query: this.currentQuery, totpOnly });
          }, 150);
        }
        if (!this.searchActive) this.closeVaultSelector();
        return;
      }
      if (this.searchActive && this.targetInput) {
        if (event.key === "Escape") {
          event.preventDefault();
          this.searchActive = false;
          this.closeVaultSelector();
          return;
        }
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
        if (event.ctrlKey && !event.altKey && event.key === "Enter") {
          event.preventDefault();
          const selected = this.vaultSelector?.children[this.selectedIndex];
          if (!selected || !selected._vaultData) return;
          this.handleVaultSelection(selected._vaultData);
          return;
        }
        if (event.ctrlKey && event.altKey && event.key === "Enter") {
          event.preventDefault();
          const selected = this.vaultSelector?.children[this.selectedIndex];
          if (!selected || !selected._vaultData) return;
          this.insertTotp(selected._vaultData);
          return;
        }
        const isChar = event.key.length === 1 || event.key === "Backspace";
        if (!isChar) return;
        this.currentQuery = this.targetInput.value.trim();
        await this.fetchVaults({ query: this.currentQuery });
      }
    }
    /**
     * Sposta il selettore con le freccie
     * @param {number} direction +- 1
     */
    moveSelection(direction) {
      const entries = this.vaultSelector?.children;
      if (!entries || entries.length === 0) return;
      entries[this.selectedIndex]?.classList.remove("active");
      this.selectedIndex += direction;
      if (this.selectedIndex < 0) this.selectedIndex = entries.length - 1;
      if (this.selectedIndex >= entries.length) this.selectedIndex = 0;
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
      if (this.isPasswordInput) {
        this.smartFillInput(this.targetInput, vault.secrets.P);
        this.closeVaultSelector();
        return;
      }
      this.smartFillInput(this.targetInput, vault.secrets.U);
      let passwordInput = null;
      const form = this.targetInput.closest("form");
      if (form) {
        passwordInput = form.querySelector('input[type="password"]');
      }
      if (!passwordInput) {
        const passwordInputs = [
          ...document.querySelectorAll('input[type="password"]')
        ];
        passwordInput = this.findNearest(passwordInputs);
      }
      if (!passwordInput) {
        const shadowInputs = [
          ...Array.from(document.querySelectorAll("*")).filter((el) => el.shadowRoot).map((el) => el.shadowRoot.querySelector('input[type="password"]')).filter(Boolean)
        ];
        passwordInput = this.findNearest(shadowInputs);
      }
      if (passwordInput) {
        this.smartFillInput(passwordInput, vault.secrets.P);
        this.searchActive = false;
      } else {
        navigator.clipboard.writeText(vault.secrets.P);
      }
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
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, value);
      } else {
        input.value = value;
      }
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
            totpOnly
          }
        });
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
      if (vaultEntries.length === 0) {
        this.vaultSelector.innerHTML = "<span style='padding: 5px'>No vault, maybe you need to log in</span>";
        return;
      }
      this.vaultSelector.innerHTML = "";
      this.selectedIndex = 0;
      vaultEntries.forEach((vault) => {
        const entry = this.renderVaultEntry(vault);
        this.vaultSelector.appendChild(entry);
      });
      if (this.vaultSelector.children[0]) {
        this.vaultSelector.children[0].classList.add("active");
      }
    }
    /**
     * Chiude il contenitore
     */
    closeVaultSelector() {
      this.vaultSelector.style.display = "none";
      this.vaultSelector.innerHTML = "";
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
      div.innerHTML = `<div class="vve-info"><strong>${vault.secrets.T ?? "No title"}</strong><span>${vault.secrets.U ?? "no username"}</span></div>
        ${!!vault.secrets.O ? '<button class="vve-totp" title="Insert TOTP code">TOTP</button>' : ""}`;
      div._vaultData = vault;
      return div;
    }
  };
  console.log("Vault Content Script Enabled");
  var service = new ContentService();
  service.init();
})();
