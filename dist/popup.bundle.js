(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

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
     * Offusca la password dell'utente prima di inviarla al server
     * in questo modo il server non sarà mai in grado di visualizzare la password degli utenti direttamente
     * @param {string} password 
     * @returns {string} stringa esadecimale
     */
    static async obfuscatePassword(password) {
      const h1 = await this.hash(password, { algorithm: "SHA-256" });
      const h2 = await this.hash(h1, { algorithm: "SHA-512" });
      return await this.hash(h2, { algorithm: "SHA-256", encoding: "hex" });
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

  // core/utils/msgpack.min.js
  !function(t) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = t();
    else if ("function" == typeof define && define.amd) define([], t);
    else {
      var r;
      r = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, r.msgpack = t();
    }
  }(function() {
    return function t(r, e, n) {
      function i(f2, u) {
        if (!e[f2]) {
          if (!r[f2]) {
            var a = "function" == typeof __require && __require;
            if (!u && a) return a(f2, true);
            if (o) return o(f2, true);
            var s = new Error("Cannot find module '" + f2 + "'");
            throw s.code = "MODULE_NOT_FOUND", s;
          }
          var c = e[f2] = { exports: {} };
          r[f2][0].call(c.exports, function(t2) {
            var e2 = r[f2][1][t2];
            return i(e2 ? e2 : t2);
          }, c, c.exports, t, r, e, n);
        }
        return e[f2].exports;
      }
      for (var o = "function" == typeof __require && __require, f = 0; f < n.length; f++) i(n[f]);
      return i;
    }({ 1: [function(t, r, e) {
      e.encode = t("./encode").encode, e.decode = t("./decode").decode, e.Encoder = t("./encoder").Encoder, e.Decoder = t("./decoder").Decoder, e.createCodec = t("./ext").createCodec, e.codec = t("./codec").codec;
    }, { "./codec": 10, "./decode": 12, "./decoder": 13, "./encode": 15, "./encoder": 16, "./ext": 20 }], 2: [function(t, r, e) {
      (function(Buffer2) {
        function t2(t3) {
          return t3 && t3.isBuffer && t3;
        }
        r.exports = t2("undefined" != typeof Buffer2 && Buffer2) || t2(this.Buffer) || t2("undefined" != typeof window && self.Buffer) || this.Buffer;
      }).call(this, t("buffer").Buffer);
    }, { buffer: 29 }], 3: [function(t, r, e) {
      function n(t2, r2) {
        for (var e2 = this, n2 = r2 || (r2 |= 0), i2 = t2.length, o2 = 0, f = 0; f < i2; ) o2 = t2.charCodeAt(f++), o2 < 128 ? e2[n2++] = o2 : o2 < 2048 ? (e2[n2++] = 192 | o2 >>> 6, e2[n2++] = 128 | 63 & o2) : o2 < 55296 || o2 > 57343 ? (e2[n2++] = 224 | o2 >>> 12, e2[n2++] = 128 | o2 >>> 6 & 63, e2[n2++] = 128 | 63 & o2) : (o2 = (o2 - 55296 << 10 | t2.charCodeAt(f++) - 56320) + 65536, e2[n2++] = 240 | o2 >>> 18, e2[n2++] = 128 | o2 >>> 12 & 63, e2[n2++] = 128 | o2 >>> 6 & 63, e2[n2++] = 128 | 63 & o2);
        return n2 - r2;
      }
      function i(t2, r2, e2) {
        var n2 = this, i2 = 0 | r2;
        e2 || (e2 = n2.length);
        for (var o2 = "", f = 0; i2 < e2; ) f = n2[i2++], f < 128 ? o2 += String.fromCharCode(f) : (192 === (224 & f) ? f = (31 & f) << 6 | 63 & n2[i2++] : 224 === (240 & f) ? f = (15 & f) << 12 | (63 & n2[i2++]) << 6 | 63 & n2[i2++] : 240 === (248 & f) && (f = (7 & f) << 18 | (63 & n2[i2++]) << 12 | (63 & n2[i2++]) << 6 | 63 & n2[i2++]), f >= 65536 ? (f -= 65536, o2 += String.fromCharCode((f >>> 10) + 55296, (1023 & f) + 56320)) : o2 += String.fromCharCode(f));
        return o2;
      }
      function o(t2, r2, e2, n2) {
        var i2;
        e2 || (e2 = 0), n2 || 0 === n2 || (n2 = this.length), r2 || (r2 = 0);
        var o2 = n2 - e2;
        if (t2 === this && e2 < r2 && r2 < n2) for (i2 = o2 - 1; i2 >= 0; i2--) t2[i2 + r2] = this[i2 + e2];
        else for (i2 = 0; i2 < o2; i2++) t2[i2 + r2] = this[i2 + e2];
        return o2;
      }
      e.copy = o, e.toString = i, e.write = n;
    }, {}], 4: [function(t, r, e) {
      function n(t2) {
        return new Array(t2);
      }
      function i(t2) {
        if (!o.isBuffer(t2) && o.isView(t2)) t2 = o.Uint8Array.from(t2);
        else if (o.isArrayBuffer(t2)) t2 = new Uint8Array(t2);
        else {
          if ("string" == typeof t2) return o.from.call(e, t2);
          if ("number" == typeof t2) throw new TypeError('"value" argument must not be a number');
        }
        return Array.prototype.slice.call(t2);
      }
      var o = t("./bufferish"), e = r.exports = n(0);
      e.alloc = n, e.concat = o.concat, e.from = i;
    }, { "./bufferish": 8 }], 5: [function(t, r, e) {
      function n(t2) {
        return new Buffer2(t2);
      }
      function i(t2) {
        if (!o.isBuffer(t2) && o.isView(t2)) t2 = o.Uint8Array.from(t2);
        else if (o.isArrayBuffer(t2)) t2 = new Uint8Array(t2);
        else {
          if ("string" == typeof t2) return o.from.call(e, t2);
          if ("number" == typeof t2) throw new TypeError('"value" argument must not be a number');
        }
        return Buffer2.from && 1 !== Buffer2.from.length ? Buffer2.from(t2) : new Buffer2(t2);
      }
      var o = t("./bufferish"), Buffer2 = o.global, e = r.exports = o.hasBuffer ? n(0) : [];
      e.alloc = o.hasBuffer && Buffer2.alloc || n, e.concat = o.concat, e.from = i;
    }, { "./bufferish": 8 }], 6: [function(t, r, e) {
      function n(t2, r2, e2, n2) {
        var o2 = a.isBuffer(this), f2 = a.isBuffer(t2);
        if (o2 && f2) return this.copy(t2, r2, e2, n2);
        if (c || o2 || f2 || !a.isView(this) || !a.isView(t2)) return u.copy.call(this, t2, r2, e2, n2);
        var s2 = e2 || null != n2 ? i.call(this, e2, n2) : this;
        return t2.set(s2, r2), s2.length;
      }
      function i(t2, r2) {
        var e2 = this.slice || !c && this.subarray;
        if (e2) return e2.call(this, t2, r2);
        var i2 = a.alloc.call(this, r2 - t2);
        return n.call(this, i2, 0, t2, r2), i2;
      }
      function o(t2, r2, e2) {
        var n2 = !s && a.isBuffer(this) ? this.toString : u.toString;
        return n2.apply(this, arguments);
      }
      function f(t2) {
        function r2() {
          var r3 = this[t2] || u[t2];
          return r3.apply(this, arguments);
        }
        return r2;
      }
      var u = t("./buffer-lite");
      e.copy = n, e.slice = i, e.toString = o, e.write = f("write");
      var a = t("./bufferish"), Buffer2 = a.global, s = a.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer2, c = s && !Buffer2.TYPED_ARRAY_SUPPORT;
    }, { "./buffer-lite": 3, "./bufferish": 8 }], 7: [function(t, r, e) {
      function n(t2) {
        return new Uint8Array(t2);
      }
      function i(t2) {
        if (o.isView(t2)) {
          var r2 = t2.byteOffset, n2 = t2.byteLength;
          t2 = t2.buffer, t2.byteLength !== n2 && (t2.slice ? t2 = t2.slice(r2, r2 + n2) : (t2 = new Uint8Array(t2), t2.byteLength !== n2 && (t2 = Array.prototype.slice.call(t2, r2, r2 + n2))));
        } else {
          if ("string" == typeof t2) return o.from.call(e, t2);
          if ("number" == typeof t2) throw new TypeError('"value" argument must not be a number');
        }
        return new Uint8Array(t2);
      }
      var o = t("./bufferish"), e = r.exports = o.hasArrayBuffer ? n(0) : [];
      e.alloc = n, e.concat = o.concat, e.from = i;
    }, { "./bufferish": 8 }], 8: [function(t, r, e) {
      function n(t2) {
        return "string" == typeof t2 ? u.call(this, t2) : a(this).from(t2);
      }
      function i(t2) {
        return a(this).alloc(t2);
      }
      function o(t2, r2) {
        function n2(t3) {
          r2 += t3.length;
        }
        function o2(t3) {
          a2 += w.copy.call(t3, u2, a2);
        }
        r2 || (r2 = 0, Array.prototype.forEach.call(t2, n2));
        var f2 = this !== e && this || t2[0], u2 = i.call(f2, r2), a2 = 0;
        return Array.prototype.forEach.call(t2, o2), u2;
      }
      function f(t2) {
        return t2 instanceof ArrayBuffer || E(t2);
      }
      function u(t2) {
        var r2 = 3 * t2.length, e2 = i.call(this, r2), n2 = w.write.call(e2, t2);
        return r2 !== n2 && (e2 = w.slice.call(e2, 0, n2)), e2;
      }
      function a(t2) {
        return d(t2) ? g : y(t2) ? b : p(t2) ? v : h ? g : l ? b : v;
      }
      function s() {
        return false;
      }
      function c(t2, r2) {
        return t2 = "[object " + t2 + "]", function(e2) {
          return null != e2 && {}.toString.call(r2 ? e2[r2] : e2) === t2;
        };
      }
      var Buffer2 = e.global = t("./buffer-global"), h = e.hasBuffer = Buffer2 && !!Buffer2.isBuffer, l = e.hasArrayBuffer = "undefined" != typeof ArrayBuffer, p = e.isArray = t("isarray");
      e.isArrayBuffer = l ? f : s;
      var d = e.isBuffer = h ? Buffer2.isBuffer : s, y = e.isView = l ? ArrayBuffer.isView || c("ArrayBuffer", "buffer") : s;
      e.alloc = i, e.concat = o, e.from = n;
      var v = e.Array = t("./bufferish-array"), g = e.Buffer = t("./bufferish-buffer"), b = e.Uint8Array = t("./bufferish-uint8array"), w = e.prototype = t("./bufferish-proto"), E = c("ArrayBuffer");
    }, { "./buffer-global": 2, "./bufferish-array": 4, "./bufferish-buffer": 5, "./bufferish-proto": 6, "./bufferish-uint8array": 7, isarray: 34 }], 9: [function(t, r, e) {
      function n(t2) {
        return this instanceof n ? (this.options = t2, void this.init()) : new n(t2);
      }
      function i(t2) {
        for (var r2 in t2) n.prototype[r2] = o(n.prototype[r2], t2[r2]);
      }
      function o(t2, r2) {
        function e2() {
          return t2.apply(this, arguments), r2.apply(this, arguments);
        }
        return t2 && r2 ? e2 : t2 || r2;
      }
      function f(t2) {
        function r2(t3, r3) {
          return r3(t3);
        }
        return t2 = t2.slice(), function(e2) {
          return t2.reduce(r2, e2);
        };
      }
      function u(t2) {
        return s(t2) ? f(t2) : t2;
      }
      function a(t2) {
        return new n(t2);
      }
      var s = t("isarray");
      e.createCodec = a, e.install = i, e.filter = u;
      var c = t("./bufferish");
      n.prototype.init = function() {
        var t2 = this.options;
        return t2 && t2.uint8array && (this.bufferish = c.Uint8Array), this;
      }, e.preset = a({ preset: true });
    }, { "./bufferish": 8, isarray: 34 }], 10: [function(t, r, e) {
      t("./read-core"), t("./write-core"), e.codec = { preset: t("./codec-base").preset };
    }, { "./codec-base": 9, "./read-core": 22, "./write-core": 25 }], 11: [function(t, r, e) {
      function n(t2) {
        if (!(this instanceof n)) return new n(t2);
        if (t2 && (this.options = t2, t2.codec)) {
          var r2 = this.codec = t2.codec;
          r2.bufferish && (this.bufferish = r2.bufferish);
        }
      }
      e.DecodeBuffer = n;
      var i = t("./read-core").preset, o = t("./flex-buffer").FlexDecoder;
      o.mixin(n.prototype), n.prototype.codec = i, n.prototype.fetch = function() {
        return this.codec.decode(this);
      };
    }, { "./flex-buffer": 21, "./read-core": 22 }], 12: [function(t, r, e) {
      function n(t2, r2) {
        var e2 = new i(r2);
        return e2.write(t2), e2.read();
      }
      e.decode = n;
      var i = t("./decode-buffer").DecodeBuffer;
    }, { "./decode-buffer": 11 }], 13: [function(t, r, e) {
      function n(t2) {
        return this instanceof n ? void o.call(this, t2) : new n(t2);
      }
      e.Decoder = n;
      var i = t("event-lite"), o = t("./decode-buffer").DecodeBuffer;
      n.prototype = new o(), i.mixin(n.prototype), n.prototype.decode = function(t2) {
        arguments.length && this.write(t2), this.flush();
      }, n.prototype.push = function(t2) {
        this.emit("data", t2);
      }, n.prototype.end = function(t2) {
        this.decode(t2), this.emit("end");
      };
    }, { "./decode-buffer": 11, "event-lite": 31 }], 14: [function(t, r, e) {
      function n(t2) {
        if (!(this instanceof n)) return new n(t2);
        if (t2 && (this.options = t2, t2.codec)) {
          var r2 = this.codec = t2.codec;
          r2.bufferish && (this.bufferish = r2.bufferish);
        }
      }
      e.EncodeBuffer = n;
      var i = t("./write-core").preset, o = t("./flex-buffer").FlexEncoder;
      o.mixin(n.prototype), n.prototype.codec = i, n.prototype.write = function(t2) {
        this.codec.encode(this, t2);
      };
    }, { "./flex-buffer": 21, "./write-core": 25 }], 15: [function(t, r, e) {
      function n(t2, r2) {
        var e2 = new i(r2);
        return e2.write(t2), e2.read();
      }
      e.encode = n;
      var i = t("./encode-buffer").EncodeBuffer;
    }, { "./encode-buffer": 14 }], 16: [function(t, r, e) {
      function n(t2) {
        return this instanceof n ? void o.call(this, t2) : new n(t2);
      }
      e.Encoder = n;
      var i = t("event-lite"), o = t("./encode-buffer").EncodeBuffer;
      n.prototype = new o(), i.mixin(n.prototype), n.prototype.encode = function(t2) {
        this.write(t2), this.emit("data", this.read());
      }, n.prototype.end = function(t2) {
        arguments.length && this.encode(t2), this.flush(), this.emit("end");
      };
    }, { "./encode-buffer": 14, "event-lite": 31 }], 17: [function(t, r, e) {
      function n(t2, r2) {
        return this instanceof n ? (this.buffer = i.from(t2), void (this.type = r2)) : new n(t2, r2);
      }
      e.ExtBuffer = n;
      var i = t("./bufferish");
    }, { "./bufferish": 8 }], 18: [function(t, r, e) {
      function n(t2) {
        t2.addExtPacker(14, Error, [u, i]), t2.addExtPacker(1, EvalError, [u, i]), t2.addExtPacker(2, RangeError, [u, i]), t2.addExtPacker(3, ReferenceError, [u, i]), t2.addExtPacker(4, SyntaxError, [u, i]), t2.addExtPacker(5, TypeError, [u, i]), t2.addExtPacker(6, URIError, [u, i]), t2.addExtPacker(10, RegExp, [f, i]), t2.addExtPacker(11, Boolean, [o, i]), t2.addExtPacker(12, String, [o, i]), t2.addExtPacker(13, Date, [Number, i]), t2.addExtPacker(15, Number, [o, i]), "undefined" != typeof Uint8Array && (t2.addExtPacker(17, Int8Array, c), t2.addExtPacker(18, Uint8Array, c), t2.addExtPacker(19, Int16Array, c), t2.addExtPacker(20, Uint16Array, c), t2.addExtPacker(21, Int32Array, c), t2.addExtPacker(22, Uint32Array, c), t2.addExtPacker(23, Float32Array, c), "undefined" != typeof Float64Array && t2.addExtPacker(24, Float64Array, c), "undefined" != typeof Uint8ClampedArray && t2.addExtPacker(25, Uint8ClampedArray, c), t2.addExtPacker(26, ArrayBuffer, c), t2.addExtPacker(29, DataView, c)), s.hasBuffer && t2.addExtPacker(27, Buffer2, s.from);
      }
      function i(r2) {
        return a || (a = t("./encode").encode), a(r2);
      }
      function o(t2) {
        return t2.valueOf();
      }
      function f(t2) {
        t2 = RegExp.prototype.toString.call(t2).split("/"), t2.shift();
        var r2 = [t2.pop()];
        return r2.unshift(t2.join("/")), r2;
      }
      function u(t2) {
        var r2 = {};
        for (var e2 in h) r2[e2] = t2[e2];
        return r2;
      }
      e.setExtPackers = n;
      var a, s = t("./bufferish"), Buffer2 = s.global, c = s.Uint8Array.from, h = { name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1 };
    }, { "./bufferish": 8, "./encode": 15 }], 19: [function(t, r, e) {
      function n(t2) {
        t2.addExtUnpacker(14, [i, f(Error)]), t2.addExtUnpacker(1, [i, f(EvalError)]), t2.addExtUnpacker(2, [i, f(RangeError)]), t2.addExtUnpacker(3, [i, f(ReferenceError)]), t2.addExtUnpacker(4, [i, f(SyntaxError)]), t2.addExtUnpacker(5, [i, f(TypeError)]), t2.addExtUnpacker(6, [i, f(URIError)]), t2.addExtUnpacker(10, [i, o]), t2.addExtUnpacker(11, [i, u(Boolean)]), t2.addExtUnpacker(12, [i, u(String)]), t2.addExtUnpacker(13, [i, u(Date)]), t2.addExtUnpacker(15, [i, u(Number)]), "undefined" != typeof Uint8Array && (t2.addExtUnpacker(17, u(Int8Array)), t2.addExtUnpacker(18, u(Uint8Array)), t2.addExtUnpacker(19, [a, u(Int16Array)]), t2.addExtUnpacker(20, [a, u(Uint16Array)]), t2.addExtUnpacker(21, [a, u(Int32Array)]), t2.addExtUnpacker(22, [a, u(Uint32Array)]), t2.addExtUnpacker(23, [a, u(Float32Array)]), "undefined" != typeof Float64Array && t2.addExtUnpacker(24, [a, u(Float64Array)]), "undefined" != typeof Uint8ClampedArray && t2.addExtUnpacker(25, u(Uint8ClampedArray)), t2.addExtUnpacker(26, a), t2.addExtUnpacker(29, [a, u(DataView)])), c.hasBuffer && t2.addExtUnpacker(27, u(Buffer2));
      }
      function i(r2) {
        return s || (s = t("./decode").decode), s(r2);
      }
      function o(t2) {
        return RegExp.apply(null, t2);
      }
      function f(t2) {
        return function(r2) {
          var e2 = new t2();
          for (var n2 in h) e2[n2] = r2[n2];
          return e2;
        };
      }
      function u(t2) {
        return function(r2) {
          return new t2(r2);
        };
      }
      function a(t2) {
        return new Uint8Array(t2).buffer;
      }
      e.setExtUnpackers = n;
      var s, c = t("./bufferish"), Buffer2 = c.global, h = { name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1 };
    }, { "./bufferish": 8, "./decode": 12 }], 20: [function(t, r, e) {
      t("./read-core"), t("./write-core"), e.createCodec = t("./codec-base").createCodec;
    }, { "./codec-base": 9, "./read-core": 22, "./write-core": 25 }], 21: [function(t, r, e) {
      function n() {
        if (!(this instanceof n)) return new n();
      }
      function i() {
        if (!(this instanceof i)) return new i();
      }
      function o() {
        function t2(t3) {
          var r3 = this.offset ? p.prototype.slice.call(this.buffer, this.offset) : this.buffer;
          this.buffer = r3 ? t3 ? this.bufferish.concat([r3, t3]) : r3 : t3, this.offset = 0;
        }
        function r2() {
          for (; this.offset < this.buffer.length; ) {
            var t3, r3 = this.offset;
            try {
              t3 = this.fetch();
            } catch (t4) {
              if (t4 && t4.message != v) throw t4;
              this.offset = r3;
              break;
            }
            this.push(t3);
          }
        }
        function e2(t3) {
          var r3 = this.offset, e3 = r3 + t3;
          if (e3 > this.buffer.length) throw new Error(v);
          return this.offset = e3, r3;
        }
        return { bufferish: p, write: t2, fetch: a, flush: r2, push: c, pull: h, read: s, reserve: e2, offset: 0 };
      }
      function f() {
        function t2() {
          var t3 = this.start;
          if (t3 < this.offset) {
            var r3 = this.start = this.offset;
            return p.prototype.slice.call(this.buffer, t3, r3);
          }
        }
        function r2() {
          for (; this.start < this.offset; ) {
            var t3 = this.fetch();
            t3 && this.push(t3);
          }
        }
        function e2() {
          var t3 = this.buffers || (this.buffers = []), r3 = t3.length > 1 ? this.bufferish.concat(t3) : t3[0];
          return t3.length = 0, r3;
        }
        function n2(t3) {
          var r3 = 0 | t3;
          if (this.buffer) {
            var e3 = this.buffer.length, n3 = 0 | this.offset, i3 = n3 + r3;
            if (i3 < e3) return this.offset = i3, n3;
            this.flush(), t3 = Math.max(t3, Math.min(2 * e3, this.maxBufferSize));
          }
          return t3 = Math.max(t3, this.minBufferSize), this.buffer = this.bufferish.alloc(t3), this.start = 0, this.offset = r3, 0;
        }
        function i2(t3) {
          var r3 = t3.length;
          if (r3 > this.minBufferSize) this.flush(), this.push(t3);
          else {
            var e3 = this.reserve(r3);
            p.prototype.copy.call(t3, this.buffer, e3);
          }
        }
        return { bufferish: p, write: u, fetch: t2, flush: r2, push: c, pull: e2, read: s, reserve: n2, send: i2, maxBufferSize: y, minBufferSize: d, offset: 0, start: 0 };
      }
      function u() {
        throw new Error("method not implemented: write()");
      }
      function a() {
        throw new Error("method not implemented: fetch()");
      }
      function s() {
        var t2 = this.buffers && this.buffers.length;
        return t2 ? (this.flush(), this.pull()) : this.fetch();
      }
      function c(t2) {
        var r2 = this.buffers || (this.buffers = []);
        r2.push(t2);
      }
      function h() {
        var t2 = this.buffers || (this.buffers = []);
        return t2.shift();
      }
      function l(t2) {
        function r2(r3) {
          for (var e2 in t2) r3[e2] = t2[e2];
          return r3;
        }
        return r2;
      }
      e.FlexDecoder = n, e.FlexEncoder = i;
      var p = t("./bufferish"), d = 2048, y = 65536, v = "BUFFER_SHORTAGE";
      n.mixin = l(o()), n.mixin(n.prototype), i.mixin = l(f()), i.mixin(i.prototype);
    }, { "./bufferish": 8 }], 22: [function(t, r, e) {
      function n(t2) {
        function r2(t3) {
          var r3 = s(t3), n2 = e2[r3];
          if (!n2) throw new Error("Invalid type: " + (r3 ? "0x" + r3.toString(16) : r3));
          return n2(t3);
        }
        var e2 = c.getReadToken(t2);
        return r2;
      }
      function i() {
        var t2 = this.options;
        return this.decode = n(t2), t2 && t2.preset && a.setExtUnpackers(this), this;
      }
      function o(t2, r2) {
        var e2 = this.extUnpackers || (this.extUnpackers = []);
        e2[t2] = h.filter(r2);
      }
      function f(t2) {
        function r2(r3) {
          return new u(r3, t2);
        }
        var e2 = this.extUnpackers || (this.extUnpackers = []);
        return e2[t2] || r2;
      }
      var u = t("./ext-buffer").ExtBuffer, a = t("./ext-unpacker"), s = t("./read-format").readUint8, c = t("./read-token"), h = t("./codec-base");
      h.install({ addExtUnpacker: o, getExtUnpacker: f, init: i }), e.preset = i.call(h.preset);
    }, { "./codec-base": 9, "./ext-buffer": 17, "./ext-unpacker": 19, "./read-format": 23, "./read-token": 24 }], 23: [function(t, r, e) {
      function n(t2) {
        var r2 = k.hasArrayBuffer && t2 && t2.binarraybuffer, e2 = t2 && t2.int64, n2 = T && t2 && t2.usemap, B2 = { map: n2 ? o : i, array: f, str: u, bin: r2 ? s : a, ext: c, uint8: h, uint16: p, uint32: y, uint64: g(8, e2 ? E : b), int8: l, int16: d, int32: v, int64: g(8, e2 ? A : w), float32: g(4, m), float64: g(8, x) };
        return B2;
      }
      function i(t2, r2) {
        var e2, n2 = {}, i2 = new Array(r2), o2 = new Array(r2), f2 = t2.codec.decode;
        for (e2 = 0; e2 < r2; e2++) i2[e2] = f2(t2), o2[e2] = f2(t2);
        for (e2 = 0; e2 < r2; e2++) n2[i2[e2]] = o2[e2];
        return n2;
      }
      function o(t2, r2) {
        var e2, n2 = /* @__PURE__ */ new Map(), i2 = new Array(r2), o2 = new Array(r2), f2 = t2.codec.decode;
        for (e2 = 0; e2 < r2; e2++) i2[e2] = f2(t2), o2[e2] = f2(t2);
        for (e2 = 0; e2 < r2; e2++) n2.set(i2[e2], o2[e2]);
        return n2;
      }
      function f(t2, r2) {
        for (var e2 = new Array(r2), n2 = t2.codec.decode, i2 = 0; i2 < r2; i2++) e2[i2] = n2(t2);
        return e2;
      }
      function u(t2, r2) {
        var e2 = t2.reserve(r2), n2 = e2 + r2;
        return _.toString.call(t2.buffer, "utf-8", e2, n2);
      }
      function a(t2, r2) {
        var e2 = t2.reserve(r2), n2 = e2 + r2, i2 = _.slice.call(t2.buffer, e2, n2);
        return k.from(i2);
      }
      function s(t2, r2) {
        var e2 = t2.reserve(r2), n2 = e2 + r2, i2 = _.slice.call(t2.buffer, e2, n2);
        return k.Uint8Array.from(i2).buffer;
      }
      function c(t2, r2) {
        var e2 = t2.reserve(r2 + 1), n2 = t2.buffer[e2++], i2 = e2 + r2, o2 = t2.codec.getExtUnpacker(n2);
        if (!o2) throw new Error("Invalid ext type: " + (n2 ? "0x" + n2.toString(16) : n2));
        var f2 = _.slice.call(t2.buffer, e2, i2);
        return o2(f2);
      }
      function h(t2) {
        var r2 = t2.reserve(1);
        return t2.buffer[r2];
      }
      function l(t2) {
        var r2 = t2.reserve(1), e2 = t2.buffer[r2];
        return 128 & e2 ? e2 - 256 : e2;
      }
      function p(t2) {
        var r2 = t2.reserve(2), e2 = t2.buffer;
        return e2[r2++] << 8 | e2[r2];
      }
      function d(t2) {
        var r2 = t2.reserve(2), e2 = t2.buffer, n2 = e2[r2++] << 8 | e2[r2];
        return 32768 & n2 ? n2 - 65536 : n2;
      }
      function y(t2) {
        var r2 = t2.reserve(4), e2 = t2.buffer;
        return 16777216 * e2[r2++] + (e2[r2++] << 16) + (e2[r2++] << 8) + e2[r2];
      }
      function v(t2) {
        var r2 = t2.reserve(4), e2 = t2.buffer;
        return e2[r2++] << 24 | e2[r2++] << 16 | e2[r2++] << 8 | e2[r2];
      }
      function g(t2, r2) {
        return function(e2) {
          var n2 = e2.reserve(t2);
          return r2.call(e2.buffer, n2, S);
        };
      }
      function b(t2) {
        return new P(this, t2).toNumber();
      }
      function w(t2) {
        return new R(this, t2).toNumber();
      }
      function E(t2) {
        return new P(this, t2);
      }
      function A(t2) {
        return new R(this, t2);
      }
      function m(t2) {
        return B.read(this, t2, false, 23, 4);
      }
      function x(t2) {
        return B.read(this, t2, false, 52, 8);
      }
      var B = t("ieee754"), U = t("int64-buffer"), P = U.Uint64BE, R = U.Int64BE;
      e.getReadFormat = n, e.readUint8 = h;
      var k = t("./bufferish"), _ = t("./bufferish-proto"), T = "undefined" != typeof Map, S = true;
    }, { "./bufferish": 8, "./bufferish-proto": 6, ieee754: 32, "int64-buffer": 33 }], 24: [function(t, r, e) {
      function n(t2) {
        var r2 = s.getReadFormat(t2);
        return t2 && t2.useraw ? o(r2) : i(r2);
      }
      function i(t2) {
        var r2, e2 = new Array(256);
        for (r2 = 0; r2 <= 127; r2++) e2[r2] = f(r2);
        for (r2 = 128; r2 <= 143; r2++) e2[r2] = a(r2 - 128, t2.map);
        for (r2 = 144; r2 <= 159; r2++) e2[r2] = a(r2 - 144, t2.array);
        for (r2 = 160; r2 <= 191; r2++) e2[r2] = a(r2 - 160, t2.str);
        for (e2[192] = f(null), e2[193] = null, e2[194] = f(false), e2[195] = f(true), e2[196] = u(t2.uint8, t2.bin), e2[197] = u(t2.uint16, t2.bin), e2[198] = u(t2.uint32, t2.bin), e2[199] = u(t2.uint8, t2.ext), e2[200] = u(t2.uint16, t2.ext), e2[201] = u(t2.uint32, t2.ext), e2[202] = t2.float32, e2[203] = t2.float64, e2[204] = t2.uint8, e2[205] = t2.uint16, e2[206] = t2.uint32, e2[207] = t2.uint64, e2[208] = t2.int8, e2[209] = t2.int16, e2[210] = t2.int32, e2[211] = t2.int64, e2[212] = a(1, t2.ext), e2[213] = a(2, t2.ext), e2[214] = a(4, t2.ext), e2[215] = a(8, t2.ext), e2[216] = a(16, t2.ext), e2[217] = u(t2.uint8, t2.str), e2[218] = u(t2.uint16, t2.str), e2[219] = u(t2.uint32, t2.str), e2[220] = u(t2.uint16, t2.array), e2[221] = u(t2.uint32, t2.array), e2[222] = u(t2.uint16, t2.map), e2[223] = u(t2.uint32, t2.map), r2 = 224; r2 <= 255; r2++) e2[r2] = f(r2 - 256);
        return e2;
      }
      function o(t2) {
        var r2, e2 = i(t2).slice();
        for (e2[217] = e2[196], e2[218] = e2[197], e2[219] = e2[198], r2 = 160; r2 <= 191; r2++) e2[r2] = a(r2 - 160, t2.bin);
        return e2;
      }
      function f(t2) {
        return function() {
          return t2;
        };
      }
      function u(t2, r2) {
        return function(e2) {
          var n2 = t2(e2);
          return r2(e2, n2);
        };
      }
      function a(t2, r2) {
        return function(e2) {
          return r2(e2, t2);
        };
      }
      var s = t("./read-format");
      e.getReadToken = n;
    }, { "./read-format": 23 }], 25: [function(t, r, e) {
      function n(t2) {
        function r2(t3, r3) {
          var n2 = e2[typeof r3];
          if (!n2) throw new Error('Unsupported type "' + typeof r3 + '": ' + r3);
          n2(t3, r3);
        }
        var e2 = s.getWriteType(t2);
        return r2;
      }
      function i() {
        var t2 = this.options;
        return this.encode = n(t2), t2 && t2.preset && a.setExtPackers(this), this;
      }
      function o(t2, r2, e2) {
        function n2(r3) {
          return e2 && (r3 = e2(r3)), new u(r3, t2);
        }
        e2 = c.filter(e2);
        var i2 = r2.name;
        if (i2 && "Object" !== i2) {
          var o2 = this.extPackers || (this.extPackers = {});
          o2[i2] = n2;
        } else {
          var f2 = this.extEncoderList || (this.extEncoderList = []);
          f2.unshift([r2, n2]);
        }
      }
      function f(t2) {
        var r2 = this.extPackers || (this.extPackers = {}), e2 = t2.constructor, n2 = e2 && e2.name && r2[e2.name];
        if (n2) return n2;
        for (var i2 = this.extEncoderList || (this.extEncoderList = []), o2 = i2.length, f2 = 0; f2 < o2; f2++) {
          var u2 = i2[f2];
          if (e2 === u2[0]) return u2[1];
        }
      }
      var u = t("./ext-buffer").ExtBuffer, a = t("./ext-packer"), s = t("./write-type"), c = t("./codec-base");
      c.install({ addExtPacker: o, getExtPacker: f, init: i }), e.preset = i.call(c.preset);
    }, { "./codec-base": 9, "./ext-buffer": 17, "./ext-packer": 18, "./write-type": 27 }], 26: [function(t, r, e) {
      function n(t2) {
        return t2 && t2.uint8array ? i() : m || E.hasBuffer && t2 && t2.safe ? f() : o();
      }
      function i() {
        var t2 = o();
        return t2[202] = c(202, 4, p), t2[203] = c(203, 8, d), t2;
      }
      function o() {
        var t2 = w.slice();
        return t2[196] = u(196), t2[197] = a(197), t2[198] = s(198), t2[199] = u(199), t2[200] = a(200), t2[201] = s(201), t2[202] = c(202, 4, x.writeFloatBE || p, true), t2[203] = c(203, 8, x.writeDoubleBE || d, true), t2[204] = u(204), t2[205] = a(205), t2[206] = s(206), t2[207] = c(207, 8, h), t2[208] = u(208), t2[209] = a(209), t2[210] = s(210), t2[211] = c(211, 8, l), t2[217] = u(217), t2[218] = a(218), t2[219] = s(219), t2[220] = a(220), t2[221] = s(221), t2[222] = a(222), t2[223] = s(223), t2;
      }
      function f() {
        var t2 = w.slice();
        return t2[196] = c(196, 1, Buffer2.prototype.writeUInt8), t2[197] = c(197, 2, Buffer2.prototype.writeUInt16BE), t2[198] = c(198, 4, Buffer2.prototype.writeUInt32BE), t2[199] = c(199, 1, Buffer2.prototype.writeUInt8), t2[200] = c(200, 2, Buffer2.prototype.writeUInt16BE), t2[201] = c(201, 4, Buffer2.prototype.writeUInt32BE), t2[202] = c(202, 4, Buffer2.prototype.writeFloatBE), t2[203] = c(203, 8, Buffer2.prototype.writeDoubleBE), t2[204] = c(204, 1, Buffer2.prototype.writeUInt8), t2[205] = c(205, 2, Buffer2.prototype.writeUInt16BE), t2[206] = c(206, 4, Buffer2.prototype.writeUInt32BE), t2[207] = c(207, 8, h), t2[208] = c(208, 1, Buffer2.prototype.writeInt8), t2[209] = c(209, 2, Buffer2.prototype.writeInt16BE), t2[210] = c(210, 4, Buffer2.prototype.writeInt32BE), t2[211] = c(211, 8, l), t2[217] = c(217, 1, Buffer2.prototype.writeUInt8), t2[218] = c(218, 2, Buffer2.prototype.writeUInt16BE), t2[219] = c(219, 4, Buffer2.prototype.writeUInt32BE), t2[220] = c(220, 2, Buffer2.prototype.writeUInt16BE), t2[221] = c(221, 4, Buffer2.prototype.writeUInt32BE), t2[222] = c(222, 2, Buffer2.prototype.writeUInt16BE), t2[223] = c(223, 4, Buffer2.prototype.writeUInt32BE), t2;
      }
      function u(t2) {
        return function(r2, e2) {
          var n2 = r2.reserve(2), i2 = r2.buffer;
          i2[n2++] = t2, i2[n2] = e2;
        };
      }
      function a(t2) {
        return function(r2, e2) {
          var n2 = r2.reserve(3), i2 = r2.buffer;
          i2[n2++] = t2, i2[n2++] = e2 >>> 8, i2[n2] = e2;
        };
      }
      function s(t2) {
        return function(r2, e2) {
          var n2 = r2.reserve(5), i2 = r2.buffer;
          i2[n2++] = t2, i2[n2++] = e2 >>> 24, i2[n2++] = e2 >>> 16, i2[n2++] = e2 >>> 8, i2[n2] = e2;
        };
      }
      function c(t2, r2, e2, n2) {
        return function(i2, o2) {
          var f2 = i2.reserve(r2 + 1);
          i2.buffer[f2++] = t2, e2.call(i2.buffer, o2, f2, n2);
        };
      }
      function h(t2, r2) {
        new g(this, r2, t2);
      }
      function l(t2, r2) {
        new b(this, r2, t2);
      }
      function p(t2, r2) {
        y.write(this, t2, r2, false, 23, 4);
      }
      function d(t2, r2) {
        y.write(this, t2, r2, false, 52, 8);
      }
      var y = t("ieee754"), v = t("int64-buffer"), g = v.Uint64BE, b = v.Int64BE, w = t("./write-uint8").uint8, E = t("./bufferish"), Buffer2 = E.global, A = E.hasBuffer && "TYPED_ARRAY_SUPPORT" in Buffer2, m = A && !Buffer2.TYPED_ARRAY_SUPPORT, x = E.hasBuffer && Buffer2.prototype || {};
      e.getWriteToken = n;
    }, { "./bufferish": 8, "./write-uint8": 28, ieee754: 32, "int64-buffer": 33 }], 27: [function(t, r, e) {
      function n(t2) {
        function r2(t3, r3) {
          var e3 = r3 ? 195 : 194;
          _[e3](t3, r3);
        }
        function e2(t3, r3) {
          var e3, n3 = 0 | r3;
          return r3 !== n3 ? (e3 = 203, void _[e3](t3, r3)) : (e3 = -32 <= n3 && n3 <= 127 ? 255 & n3 : 0 <= n3 ? n3 <= 255 ? 204 : n3 <= 65535 ? 205 : 206 : -128 <= n3 ? 208 : -32768 <= n3 ? 209 : 210, void _[e3](t3, n3));
        }
        function n2(t3, r3) {
          var e3 = 207;
          _[e3](t3, r3.toArray());
        }
        function o2(t3, r3) {
          var e3 = 211;
          _[e3](t3, r3.toArray());
        }
        function v(t3) {
          return t3 < 32 ? 1 : t3 <= 255 ? 2 : t3 <= 65535 ? 3 : 5;
        }
        function g(t3) {
          return t3 < 32 ? 1 : t3 <= 65535 ? 3 : 5;
        }
        function b(t3) {
          function r3(r4, e3) {
            var n3 = e3.length, i2 = 5 + 3 * n3;
            r4.offset = r4.reserve(i2);
            var o3 = r4.buffer, f2 = t3(n3), u2 = r4.offset + f2;
            n3 = s.write.call(o3, e3, u2);
            var a2 = t3(n3);
            if (f2 !== a2) {
              var c2 = u2 + a2 - f2, h2 = u2 + n3;
              s.copy.call(o3, o3, c2, u2, h2);
            }
            var l2 = 1 === a2 ? 160 + n3 : a2 <= 3 ? 215 + a2 : 219;
            _[l2](r4, n3), r4.offset += n3;
          }
          return r3;
        }
        function w(t3, r3) {
          if (null === r3) return A(t3, r3);
          if (I(r3)) return Y(t3, r3);
          if (i(r3)) return m(t3, r3);
          if (f.isUint64BE(r3)) return n2(t3, r3);
          if (u.isInt64BE(r3)) return o2(t3, r3);
          var e3 = t3.codec.getExtPacker(r3);
          return e3 && (r3 = e3(r3)), r3 instanceof l ? U(t3, r3) : void D(t3, r3);
        }
        function E(t3, r3) {
          return I(r3) ? k(t3, r3) : void w(t3, r3);
        }
        function A(t3, r3) {
          var e3 = 192;
          _[e3](t3, r3);
        }
        function m(t3, r3) {
          var e3 = r3.length, n3 = e3 < 16 ? 144 + e3 : e3 <= 65535 ? 220 : 221;
          _[n3](t3, e3);
          for (var i2 = t3.codec.encode, o3 = 0; o3 < e3; o3++) i2(t3, r3[o3]);
        }
        function x(t3, r3) {
          var e3 = r3.length, n3 = e3 < 255 ? 196 : e3 <= 65535 ? 197 : 198;
          _[n3](t3, e3), t3.send(r3);
        }
        function B(t3, r3) {
          x(t3, new Uint8Array(r3));
        }
        function U(t3, r3) {
          var e3 = r3.buffer, n3 = e3.length, i2 = y[n3] || (n3 < 255 ? 199 : n3 <= 65535 ? 200 : 201);
          _[i2](t3, n3), h[r3.type](t3), t3.send(e3);
        }
        function P(t3, r3) {
          var e3 = Object.keys(r3), n3 = e3.length, i2 = n3 < 16 ? 128 + n3 : n3 <= 65535 ? 222 : 223;
          _[i2](t3, n3);
          var o3 = t3.codec.encode;
          e3.forEach(function(e4) {
            o3(t3, e4), o3(t3, r3[e4]);
          });
        }
        function R(t3, r3) {
          if (!(r3 instanceof Map)) return P(t3, r3);
          var e3 = r3.size, n3 = e3 < 16 ? 128 + e3 : e3 <= 65535 ? 222 : 223;
          _[n3](t3, e3);
          var i2 = t3.codec.encode;
          r3.forEach(function(r4, e4, n4) {
            i2(t3, e4), i2(t3, r4);
          });
        }
        function k(t3, r3) {
          var e3 = r3.length, n3 = e3 < 32 ? 160 + e3 : e3 <= 65535 ? 218 : 219;
          _[n3](t3, e3), t3.send(r3);
        }
        var _ = c.getWriteToken(t2), T = t2 && t2.useraw, S = p && t2 && t2.binarraybuffer, I = S ? a.isArrayBuffer : a.isBuffer, Y = S ? B : x, C = d && t2 && t2.usemap, D = C ? R : P, O = { boolean: r2, function: A, number: e2, object: T ? E : w, string: b(T ? g : v), symbol: A, undefined: A };
        return O;
      }
      var i = t("isarray"), o = t("int64-buffer"), f = o.Uint64BE, u = o.Int64BE, a = t("./bufferish"), s = t("./bufferish-proto"), c = t("./write-token"), h = t("./write-uint8").uint8, l = t("./ext-buffer").ExtBuffer, p = "undefined" != typeof Uint8Array, d = "undefined" != typeof Map, y = [];
      y[1] = 212, y[2] = 213, y[4] = 214, y[8] = 215, y[16] = 216, e.getWriteType = n;
    }, { "./bufferish": 8, "./bufferish-proto": 6, "./ext-buffer": 17, "./write-token": 26, "./write-uint8": 28, "int64-buffer": 33, isarray: 34 }], 28: [function(t, r, e) {
      function n(t2) {
        return function(r2) {
          var e2 = r2.reserve(1);
          r2.buffer[e2] = t2;
        };
      }
      for (var i = e.uint8 = new Array(256), o = 0; o <= 255; o++) i[o] = n(o);
    }, {}], 29: [function(t, r, e) {
      (function(r2) {
        "use strict";
        function n() {
          try {
            var t2 = new Uint8Array(1);
            return t2.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
              return 42;
            } }, 42 === t2.foo() && "function" == typeof t2.subarray && 0 === t2.subarray(1, 1).byteLength;
          } catch (t3) {
            return false;
          }
        }
        function i() {
          return Buffer2.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
        }
        function o(t2, r3) {
          if (i() < r3) throw new RangeError("Invalid typed array length");
          return Buffer2.TYPED_ARRAY_SUPPORT ? (t2 = new Uint8Array(r3), t2.__proto__ = Buffer2.prototype) : (null === t2 && (t2 = new Buffer2(r3)), t2.length = r3), t2;
        }
        function Buffer2(t2, r3, e2) {
          if (!(Buffer2.TYPED_ARRAY_SUPPORT || this instanceof Buffer2)) return new Buffer2(t2, r3, e2);
          if ("number" == typeof t2) {
            if ("string" == typeof r3) throw new Error("If encoding is specified then the first argument must be a string");
            return s(this, t2);
          }
          return f(this, t2, r3, e2);
        }
        function f(t2, r3, e2, n2) {
          if ("number" == typeof r3) throw new TypeError('"value" argument must not be a number');
          return "undefined" != typeof ArrayBuffer && r3 instanceof ArrayBuffer ? l(t2, r3, e2, n2) : "string" == typeof r3 ? c(t2, r3, e2) : p(t2, r3);
        }
        function u(t2) {
          if ("number" != typeof t2) throw new TypeError('"size" argument must be a number');
          if (t2 < 0) throw new RangeError('"size" argument must not be negative');
        }
        function a(t2, r3, e2, n2) {
          return u(r3), r3 <= 0 ? o(t2, r3) : void 0 !== e2 ? "string" == typeof n2 ? o(t2, r3).fill(e2, n2) : o(t2, r3).fill(e2) : o(t2, r3);
        }
        function s(t2, r3) {
          if (u(r3), t2 = o(t2, r3 < 0 ? 0 : 0 | d(r3)), !Buffer2.TYPED_ARRAY_SUPPORT) for (var e2 = 0; e2 < r3; ++e2) t2[e2] = 0;
          return t2;
        }
        function c(t2, r3, e2) {
          if ("string" == typeof e2 && "" !== e2 || (e2 = "utf8"), !Buffer2.isEncoding(e2)) throw new TypeError('"encoding" must be a valid string encoding');
          var n2 = 0 | v(r3, e2);
          t2 = o(t2, n2);
          var i2 = t2.write(r3, e2);
          return i2 !== n2 && (t2 = t2.slice(0, i2)), t2;
        }
        function h(t2, r3) {
          var e2 = r3.length < 0 ? 0 : 0 | d(r3.length);
          t2 = o(t2, e2);
          for (var n2 = 0; n2 < e2; n2 += 1) t2[n2] = 255 & r3[n2];
          return t2;
        }
        function l(t2, r3, e2, n2) {
          if (r3.byteLength, e2 < 0 || r3.byteLength < e2) throw new RangeError("'offset' is out of bounds");
          if (r3.byteLength < e2 + (n2 || 0)) throw new RangeError("'length' is out of bounds");
          return r3 = void 0 === e2 && void 0 === n2 ? new Uint8Array(r3) : void 0 === n2 ? new Uint8Array(r3, e2) : new Uint8Array(r3, e2, n2), Buffer2.TYPED_ARRAY_SUPPORT ? (t2 = r3, t2.__proto__ = Buffer2.prototype) : t2 = h(t2, r3), t2;
        }
        function p(t2, r3) {
          if (Buffer2.isBuffer(r3)) {
            var e2 = 0 | d(r3.length);
            return t2 = o(t2, e2), 0 === t2.length ? t2 : (r3.copy(t2, 0, 0, e2), t2);
          }
          if (r3) {
            if ("undefined" != typeof ArrayBuffer && r3.buffer instanceof ArrayBuffer || "length" in r3) return "number" != typeof r3.length || H(r3.length) ? o(t2, 0) : h(t2, r3);
            if ("Buffer" === r3.type && Q(r3.data)) return h(t2, r3.data);
          }
          throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
        }
        function d(t2) {
          if (t2 >= i()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i().toString(16) + " bytes");
          return 0 | t2;
        }
        function y(t2) {
          return +t2 != t2 && (t2 = 0), Buffer2.alloc(+t2);
        }
        function v(t2, r3) {
          if (Buffer2.isBuffer(t2)) return t2.length;
          if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t2) || t2 instanceof ArrayBuffer)) return t2.byteLength;
          "string" != typeof t2 && (t2 = "" + t2);
          var e2 = t2.length;
          if (0 === e2) return 0;
          for (var n2 = false; ; ) switch (r3) {
            case "ascii":
            case "latin1":
            case "binary":
              return e2;
            case "utf8":
            case "utf-8":
            case void 0:
              return q(t2).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return 2 * e2;
            case "hex":
              return e2 >>> 1;
            case "base64":
              return X(t2).length;
            default:
              if (n2) return q(t2).length;
              r3 = ("" + r3).toLowerCase(), n2 = true;
          }
        }
        function g(t2, r3, e2) {
          var n2 = false;
          if ((void 0 === r3 || r3 < 0) && (r3 = 0), r3 > this.length) return "";
          if ((void 0 === e2 || e2 > this.length) && (e2 = this.length), e2 <= 0) return "";
          if (e2 >>>= 0, r3 >>>= 0, e2 <= r3) return "";
          for (t2 || (t2 = "utf8"); ; ) switch (t2) {
            case "hex":
              return I(this, r3, e2);
            case "utf8":
            case "utf-8":
              return k(this, r3, e2);
            case "ascii":
              return T(this, r3, e2);
            case "latin1":
            case "binary":
              return S(this, r3, e2);
            case "base64":
              return R(this, r3, e2);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return Y(this, r3, e2);
            default:
              if (n2) throw new TypeError("Unknown encoding: " + t2);
              t2 = (t2 + "").toLowerCase(), n2 = true;
          }
        }
        function b(t2, r3, e2) {
          var n2 = t2[r3];
          t2[r3] = t2[e2], t2[e2] = n2;
        }
        function w(t2, r3, e2, n2, i2) {
          if (0 === t2.length) return -1;
          if ("string" == typeof e2 ? (n2 = e2, e2 = 0) : e2 > 2147483647 ? e2 = 2147483647 : e2 < -2147483648 && (e2 = -2147483648), e2 = +e2, isNaN(e2) && (e2 = i2 ? 0 : t2.length - 1), e2 < 0 && (e2 = t2.length + e2), e2 >= t2.length) {
            if (i2) return -1;
            e2 = t2.length - 1;
          } else if (e2 < 0) {
            if (!i2) return -1;
            e2 = 0;
          }
          if ("string" == typeof r3 && (r3 = Buffer2.from(r3, n2)), Buffer2.isBuffer(r3)) return 0 === r3.length ? -1 : E(t2, r3, e2, n2, i2);
          if ("number" == typeof r3) return r3 = 255 & r3, Buffer2.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? i2 ? Uint8Array.prototype.indexOf.call(t2, r3, e2) : Uint8Array.prototype.lastIndexOf.call(t2, r3, e2) : E(t2, [r3], e2, n2, i2);
          throw new TypeError("val must be string, number or Buffer");
        }
        function E(t2, r3, e2, n2, i2) {
          function o2(t3, r4) {
            return 1 === f2 ? t3[r4] : t3.readUInt16BE(r4 * f2);
          }
          var f2 = 1, u2 = t2.length, a2 = r3.length;
          if (void 0 !== n2 && (n2 = String(n2).toLowerCase(), "ucs2" === n2 || "ucs-2" === n2 || "utf16le" === n2 || "utf-16le" === n2)) {
            if (t2.length < 2 || r3.length < 2) return -1;
            f2 = 2, u2 /= 2, a2 /= 2, e2 /= 2;
          }
          var s2;
          if (i2) {
            var c2 = -1;
            for (s2 = e2; s2 < u2; s2++) if (o2(t2, s2) === o2(r3, c2 === -1 ? 0 : s2 - c2)) {
              if (c2 === -1 && (c2 = s2), s2 - c2 + 1 === a2) return c2 * f2;
            } else c2 !== -1 && (s2 -= s2 - c2), c2 = -1;
          } else for (e2 + a2 > u2 && (e2 = u2 - a2), s2 = e2; s2 >= 0; s2--) {
            for (var h2 = true, l2 = 0; l2 < a2; l2++) if (o2(t2, s2 + l2) !== o2(r3, l2)) {
              h2 = false;
              break;
            }
            if (h2) return s2;
          }
          return -1;
        }
        function A(t2, r3, e2, n2) {
          e2 = Number(e2) || 0;
          var i2 = t2.length - e2;
          n2 ? (n2 = Number(n2), n2 > i2 && (n2 = i2)) : n2 = i2;
          var o2 = r3.length;
          if (o2 % 2 !== 0) throw new TypeError("Invalid hex string");
          n2 > o2 / 2 && (n2 = o2 / 2);
          for (var f2 = 0; f2 < n2; ++f2) {
            var u2 = parseInt(r3.substr(2 * f2, 2), 16);
            if (isNaN(u2)) return f2;
            t2[e2 + f2] = u2;
          }
          return f2;
        }
        function m(t2, r3, e2, n2) {
          return G(q(r3, t2.length - e2), t2, e2, n2);
        }
        function x(t2, r3, e2, n2) {
          return G(W(r3), t2, e2, n2);
        }
        function B(t2, r3, e2, n2) {
          return x(t2, r3, e2, n2);
        }
        function U(t2, r3, e2, n2) {
          return G(X(r3), t2, e2, n2);
        }
        function P(t2, r3, e2, n2) {
          return G(J(r3, t2.length - e2), t2, e2, n2);
        }
        function R(t2, r3, e2) {
          return 0 === r3 && e2 === t2.length ? Z.fromByteArray(t2) : Z.fromByteArray(t2.slice(r3, e2));
        }
        function k(t2, r3, e2) {
          e2 = Math.min(t2.length, e2);
          for (var n2 = [], i2 = r3; i2 < e2; ) {
            var o2 = t2[i2], f2 = null, u2 = o2 > 239 ? 4 : o2 > 223 ? 3 : o2 > 191 ? 2 : 1;
            if (i2 + u2 <= e2) {
              var a2, s2, c2, h2;
              switch (u2) {
                case 1:
                  o2 < 128 && (f2 = o2);
                  break;
                case 2:
                  a2 = t2[i2 + 1], 128 === (192 & a2) && (h2 = (31 & o2) << 6 | 63 & a2, h2 > 127 && (f2 = h2));
                  break;
                case 3:
                  a2 = t2[i2 + 1], s2 = t2[i2 + 2], 128 === (192 & a2) && 128 === (192 & s2) && (h2 = (15 & o2) << 12 | (63 & a2) << 6 | 63 & s2, h2 > 2047 && (h2 < 55296 || h2 > 57343) && (f2 = h2));
                  break;
                case 4:
                  a2 = t2[i2 + 1], s2 = t2[i2 + 2], c2 = t2[i2 + 3], 128 === (192 & a2) && 128 === (192 & s2) && 128 === (192 & c2) && (h2 = (15 & o2) << 18 | (63 & a2) << 12 | (63 & s2) << 6 | 63 & c2, h2 > 65535 && h2 < 1114112 && (f2 = h2));
              }
            }
            null === f2 ? (f2 = 65533, u2 = 1) : f2 > 65535 && (f2 -= 65536, n2.push(f2 >>> 10 & 1023 | 55296), f2 = 56320 | 1023 & f2), n2.push(f2), i2 += u2;
          }
          return _(n2);
        }
        function _(t2) {
          var r3 = t2.length;
          if (r3 <= $) return String.fromCharCode.apply(String, t2);
          for (var e2 = "", n2 = 0; n2 < r3; ) e2 += String.fromCharCode.apply(String, t2.slice(n2, n2 += $));
          return e2;
        }
        function T(t2, r3, e2) {
          var n2 = "";
          e2 = Math.min(t2.length, e2);
          for (var i2 = r3; i2 < e2; ++i2) n2 += String.fromCharCode(127 & t2[i2]);
          return n2;
        }
        function S(t2, r3, e2) {
          var n2 = "";
          e2 = Math.min(t2.length, e2);
          for (var i2 = r3; i2 < e2; ++i2) n2 += String.fromCharCode(t2[i2]);
          return n2;
        }
        function I(t2, r3, e2) {
          var n2 = t2.length;
          (!r3 || r3 < 0) && (r3 = 0), (!e2 || e2 < 0 || e2 > n2) && (e2 = n2);
          for (var i2 = "", o2 = r3; o2 < e2; ++o2) i2 += V(t2[o2]);
          return i2;
        }
        function Y(t2, r3, e2) {
          for (var n2 = t2.slice(r3, e2), i2 = "", o2 = 0; o2 < n2.length; o2 += 2) i2 += String.fromCharCode(n2[o2] + 256 * n2[o2 + 1]);
          return i2;
        }
        function C(t2, r3, e2) {
          if (t2 % 1 !== 0 || t2 < 0) throw new RangeError("offset is not uint");
          if (t2 + r3 > e2) throw new RangeError("Trying to access beyond buffer length");
        }
        function D(t2, r3, e2, n2, i2, o2) {
          if (!Buffer2.isBuffer(t2)) throw new TypeError('"buffer" argument must be a Buffer instance');
          if (r3 > i2 || r3 < o2) throw new RangeError('"value" argument is out of bounds');
          if (e2 + n2 > t2.length) throw new RangeError("Index out of range");
        }
        function O(t2, r3, e2, n2) {
          r3 < 0 && (r3 = 65535 + r3 + 1);
          for (var i2 = 0, o2 = Math.min(t2.length - e2, 2); i2 < o2; ++i2) t2[e2 + i2] = (r3 & 255 << 8 * (n2 ? i2 : 1 - i2)) >>> 8 * (n2 ? i2 : 1 - i2);
        }
        function L(t2, r3, e2, n2) {
          r3 < 0 && (r3 = 4294967295 + r3 + 1);
          for (var i2 = 0, o2 = Math.min(t2.length - e2, 4); i2 < o2; ++i2) t2[e2 + i2] = r3 >>> 8 * (n2 ? i2 : 3 - i2) & 255;
        }
        function M(t2, r3, e2, n2, i2, o2) {
          if (e2 + n2 > t2.length) throw new RangeError("Index out of range");
          if (e2 < 0) throw new RangeError("Index out of range");
        }
        function N(t2, r3, e2, n2, i2) {
          return i2 || M(t2, r3, e2, 4, 34028234663852886e22, -34028234663852886e22), K.write(t2, r3, e2, n2, 23, 4), e2 + 4;
        }
        function F(t2, r3, e2, n2, i2) {
          return i2 || M(t2, r3, e2, 8, 17976931348623157e292, -17976931348623157e292), K.write(t2, r3, e2, n2, 52, 8), e2 + 8;
        }
        function j(t2) {
          if (t2 = z(t2).replace(tt, ""), t2.length < 2) return "";
          for (; t2.length % 4 !== 0; ) t2 += "=";
          return t2;
        }
        function z(t2) {
          return t2.trim ? t2.trim() : t2.replace(/^\s+|\s+$/g, "");
        }
        function V(t2) {
          return t2 < 16 ? "0" + t2.toString(16) : t2.toString(16);
        }
        function q(t2, r3) {
          r3 = r3 || 1 / 0;
          for (var e2, n2 = t2.length, i2 = null, o2 = [], f2 = 0; f2 < n2; ++f2) {
            if (e2 = t2.charCodeAt(f2), e2 > 55295 && e2 < 57344) {
              if (!i2) {
                if (e2 > 56319) {
                  (r3 -= 3) > -1 && o2.push(239, 191, 189);
                  continue;
                }
                if (f2 + 1 === n2) {
                  (r3 -= 3) > -1 && o2.push(239, 191, 189);
                  continue;
                }
                i2 = e2;
                continue;
              }
              if (e2 < 56320) {
                (r3 -= 3) > -1 && o2.push(239, 191, 189), i2 = e2;
                continue;
              }
              e2 = (i2 - 55296 << 10 | e2 - 56320) + 65536;
            } else i2 && (r3 -= 3) > -1 && o2.push(239, 191, 189);
            if (i2 = null, e2 < 128) {
              if ((r3 -= 1) < 0) break;
              o2.push(e2);
            } else if (e2 < 2048) {
              if ((r3 -= 2) < 0) break;
              o2.push(e2 >> 6 | 192, 63 & e2 | 128);
            } else if (e2 < 65536) {
              if ((r3 -= 3) < 0) break;
              o2.push(e2 >> 12 | 224, e2 >> 6 & 63 | 128, 63 & e2 | 128);
            } else {
              if (!(e2 < 1114112)) throw new Error("Invalid code point");
              if ((r3 -= 4) < 0) break;
              o2.push(e2 >> 18 | 240, e2 >> 12 & 63 | 128, e2 >> 6 & 63 | 128, 63 & e2 | 128);
            }
          }
          return o2;
        }
        function W(t2) {
          for (var r3 = [], e2 = 0; e2 < t2.length; ++e2) r3.push(255 & t2.charCodeAt(e2));
          return r3;
        }
        function J(t2, r3) {
          for (var e2, n2, i2, o2 = [], f2 = 0; f2 < t2.length && !((r3 -= 2) < 0); ++f2) e2 = t2.charCodeAt(f2), n2 = e2 >> 8, i2 = e2 % 256, o2.push(i2), o2.push(n2);
          return o2;
        }
        function X(t2) {
          return Z.toByteArray(j(t2));
        }
        function G(t2, r3, e2, n2) {
          for (var i2 = 0; i2 < n2 && !(i2 + e2 >= r3.length || i2 >= t2.length); ++i2) r3[i2 + e2] = t2[i2];
          return i2;
        }
        function H(t2) {
          return t2 !== t2;
        }
        var Z = t("base64-js"), K = t("ieee754"), Q = t("isarray");
        e.Buffer = Buffer2, e.SlowBuffer = y, e.INSPECT_MAX_BYTES = 50, Buffer2.TYPED_ARRAY_SUPPORT = void 0 !== r2.TYPED_ARRAY_SUPPORT ? r2.TYPED_ARRAY_SUPPORT : n(), e.kMaxLength = i(), Buffer2.poolSize = 8192, Buffer2._augment = function(t2) {
          return t2.__proto__ = Buffer2.prototype, t2;
        }, Buffer2.from = function(t2, r3, e2) {
          return f(null, t2, r3, e2);
        }, Buffer2.TYPED_ARRAY_SUPPORT && (Buffer2.prototype.__proto__ = Uint8Array.prototype, Buffer2.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && Buffer2[Symbol.species] === Buffer2 && Object.defineProperty(Buffer2, Symbol.species, { value: null, configurable: true })), Buffer2.alloc = function(t2, r3, e2) {
          return a(null, t2, r3, e2);
        }, Buffer2.allocUnsafe = function(t2) {
          return s(null, t2);
        }, Buffer2.allocUnsafeSlow = function(t2) {
          return s(null, t2);
        }, Buffer2.isBuffer = function(t2) {
          return !(null == t2 || !t2._isBuffer);
        }, Buffer2.compare = function(t2, r3) {
          if (!Buffer2.isBuffer(t2) || !Buffer2.isBuffer(r3)) throw new TypeError("Arguments must be Buffers");
          if (t2 === r3) return 0;
          for (var e2 = t2.length, n2 = r3.length, i2 = 0, o2 = Math.min(e2, n2); i2 < o2; ++i2) if (t2[i2] !== r3[i2]) {
            e2 = t2[i2], n2 = r3[i2];
            break;
          }
          return e2 < n2 ? -1 : n2 < e2 ? 1 : 0;
        }, Buffer2.isEncoding = function(t2) {
          switch (String(t2).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return true;
            default:
              return false;
          }
        }, Buffer2.concat = function(t2, r3) {
          if (!Q(t2)) throw new TypeError('"list" argument must be an Array of Buffers');
          if (0 === t2.length) return Buffer2.alloc(0);
          var e2;
          if (void 0 === r3) for (r3 = 0, e2 = 0; e2 < t2.length; ++e2) r3 += t2[e2].length;
          var n2 = Buffer2.allocUnsafe(r3), i2 = 0;
          for (e2 = 0; e2 < t2.length; ++e2) {
            var o2 = t2[e2];
            if (!Buffer2.isBuffer(o2)) throw new TypeError('"list" argument must be an Array of Buffers');
            o2.copy(n2, i2), i2 += o2.length;
          }
          return n2;
        }, Buffer2.byteLength = v, Buffer2.prototype._isBuffer = true, Buffer2.prototype.swap16 = function() {
          var t2 = this.length;
          if (t2 % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
          for (var r3 = 0; r3 < t2; r3 += 2) b(this, r3, r3 + 1);
          return this;
        }, Buffer2.prototype.swap32 = function() {
          var t2 = this.length;
          if (t2 % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
          for (var r3 = 0; r3 < t2; r3 += 4) b(this, r3, r3 + 3), b(this, r3 + 1, r3 + 2);
          return this;
        }, Buffer2.prototype.swap64 = function() {
          var t2 = this.length;
          if (t2 % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
          for (var r3 = 0; r3 < t2; r3 += 8) b(this, r3, r3 + 7), b(this, r3 + 1, r3 + 6), b(this, r3 + 2, r3 + 5), b(this, r3 + 3, r3 + 4);
          return this;
        }, Buffer2.prototype.toString = function() {
          var t2 = 0 | this.length;
          return 0 === t2 ? "" : 0 === arguments.length ? k(this, 0, t2) : g.apply(this, arguments);
        }, Buffer2.prototype.equals = function(t2) {
          if (!Buffer2.isBuffer(t2)) throw new TypeError("Argument must be a Buffer");
          return this === t2 || 0 === Buffer2.compare(this, t2);
        }, Buffer2.prototype.inspect = function() {
          var t2 = "", r3 = e.INSPECT_MAX_BYTES;
          return this.length > 0 && (t2 = this.toString("hex", 0, r3).match(/.{2}/g).join(" "), this.length > r3 && (t2 += " ... ")), "<Buffer " + t2 + ">";
        }, Buffer2.prototype.compare = function(t2, r3, e2, n2, i2) {
          if (!Buffer2.isBuffer(t2)) throw new TypeError("Argument must be a Buffer");
          if (void 0 === r3 && (r3 = 0), void 0 === e2 && (e2 = t2 ? t2.length : 0), void 0 === n2 && (n2 = 0), void 0 === i2 && (i2 = this.length), r3 < 0 || e2 > t2.length || n2 < 0 || i2 > this.length) throw new RangeError("out of range index");
          if (n2 >= i2 && r3 >= e2) return 0;
          if (n2 >= i2) return -1;
          if (r3 >= e2) return 1;
          if (r3 >>>= 0, e2 >>>= 0, n2 >>>= 0, i2 >>>= 0, this === t2) return 0;
          for (var o2 = i2 - n2, f2 = e2 - r3, u2 = Math.min(o2, f2), a2 = this.slice(n2, i2), s2 = t2.slice(r3, e2), c2 = 0; c2 < u2; ++c2) if (a2[c2] !== s2[c2]) {
            o2 = a2[c2], f2 = s2[c2];
            break;
          }
          return o2 < f2 ? -1 : f2 < o2 ? 1 : 0;
        }, Buffer2.prototype.includes = function(t2, r3, e2) {
          return this.indexOf(t2, r3, e2) !== -1;
        }, Buffer2.prototype.indexOf = function(t2, r3, e2) {
          return w(this, t2, r3, e2, true);
        }, Buffer2.prototype.lastIndexOf = function(t2, r3, e2) {
          return w(this, t2, r3, e2, false);
        }, Buffer2.prototype.write = function(t2, r3, e2, n2) {
          if (void 0 === r3) n2 = "utf8", e2 = this.length, r3 = 0;
          else if (void 0 === e2 && "string" == typeof r3) n2 = r3, e2 = this.length, r3 = 0;
          else {
            if (!isFinite(r3)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            r3 = 0 | r3, isFinite(e2) ? (e2 = 0 | e2, void 0 === n2 && (n2 = "utf8")) : (n2 = e2, e2 = void 0);
          }
          var i2 = this.length - r3;
          if ((void 0 === e2 || e2 > i2) && (e2 = i2), t2.length > 0 && (e2 < 0 || r3 < 0) || r3 > this.length) throw new RangeError("Attempt to write outside buffer bounds");
          n2 || (n2 = "utf8");
          for (var o2 = false; ; ) switch (n2) {
            case "hex":
              return A(this, t2, r3, e2);
            case "utf8":
            case "utf-8":
              return m(this, t2, r3, e2);
            case "ascii":
              return x(this, t2, r3, e2);
            case "latin1":
            case "binary":
              return B(this, t2, r3, e2);
            case "base64":
              return U(this, t2, r3, e2);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return P(this, t2, r3, e2);
            default:
              if (o2) throw new TypeError("Unknown encoding: " + n2);
              n2 = ("" + n2).toLowerCase(), o2 = true;
          }
        }, Buffer2.prototype.toJSON = function() {
          return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
        };
        var $ = 4096;
        Buffer2.prototype.slice = function(t2, r3) {
          var e2 = this.length;
          t2 = ~~t2, r3 = void 0 === r3 ? e2 : ~~r3, t2 < 0 ? (t2 += e2, t2 < 0 && (t2 = 0)) : t2 > e2 && (t2 = e2), r3 < 0 ? (r3 += e2, r3 < 0 && (r3 = 0)) : r3 > e2 && (r3 = e2), r3 < t2 && (r3 = t2);
          var n2;
          if (Buffer2.TYPED_ARRAY_SUPPORT) n2 = this.subarray(t2, r3), n2.__proto__ = Buffer2.prototype;
          else {
            var i2 = r3 - t2;
            n2 = new Buffer2(i2, void 0);
            for (var o2 = 0; o2 < i2; ++o2) n2[o2] = this[o2 + t2];
          }
          return n2;
        }, Buffer2.prototype.readUIntLE = function(t2, r3, e2) {
          t2 = 0 | t2, r3 = 0 | r3, e2 || C(t2, r3, this.length);
          for (var n2 = this[t2], i2 = 1, o2 = 0; ++o2 < r3 && (i2 *= 256); ) n2 += this[t2 + o2] * i2;
          return n2;
        }, Buffer2.prototype.readUIntBE = function(t2, r3, e2) {
          t2 = 0 | t2, r3 = 0 | r3, e2 || C(t2, r3, this.length);
          for (var n2 = this[t2 + --r3], i2 = 1; r3 > 0 && (i2 *= 256); ) n2 += this[t2 + --r3] * i2;
          return n2;
        }, Buffer2.prototype.readUInt8 = function(t2, r3) {
          return r3 || C(t2, 1, this.length), this[t2];
        }, Buffer2.prototype.readUInt16LE = function(t2, r3) {
          return r3 || C(t2, 2, this.length), this[t2] | this[t2 + 1] << 8;
        }, Buffer2.prototype.readUInt16BE = function(t2, r3) {
          return r3 || C(t2, 2, this.length), this[t2] << 8 | this[t2 + 1];
        }, Buffer2.prototype.readUInt32LE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), (this[t2] | this[t2 + 1] << 8 | this[t2 + 2] << 16) + 16777216 * this[t2 + 3];
        }, Buffer2.prototype.readUInt32BE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), 16777216 * this[t2] + (this[t2 + 1] << 16 | this[t2 + 2] << 8 | this[t2 + 3]);
        }, Buffer2.prototype.readIntLE = function(t2, r3, e2) {
          t2 = 0 | t2, r3 = 0 | r3, e2 || C(t2, r3, this.length);
          for (var n2 = this[t2], i2 = 1, o2 = 0; ++o2 < r3 && (i2 *= 256); ) n2 += this[t2 + o2] * i2;
          return i2 *= 128, n2 >= i2 && (n2 -= Math.pow(2, 8 * r3)), n2;
        }, Buffer2.prototype.readIntBE = function(t2, r3, e2) {
          t2 = 0 | t2, r3 = 0 | r3, e2 || C(t2, r3, this.length);
          for (var n2 = r3, i2 = 1, o2 = this[t2 + --n2]; n2 > 0 && (i2 *= 256); ) o2 += this[t2 + --n2] * i2;
          return i2 *= 128, o2 >= i2 && (o2 -= Math.pow(2, 8 * r3)), o2;
        }, Buffer2.prototype.readInt8 = function(t2, r3) {
          return r3 || C(t2, 1, this.length), 128 & this[t2] ? (255 - this[t2] + 1) * -1 : this[t2];
        }, Buffer2.prototype.readInt16LE = function(t2, r3) {
          r3 || C(t2, 2, this.length);
          var e2 = this[t2] | this[t2 + 1] << 8;
          return 32768 & e2 ? 4294901760 | e2 : e2;
        }, Buffer2.prototype.readInt16BE = function(t2, r3) {
          r3 || C(t2, 2, this.length);
          var e2 = this[t2 + 1] | this[t2] << 8;
          return 32768 & e2 ? 4294901760 | e2 : e2;
        }, Buffer2.prototype.readInt32LE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), this[t2] | this[t2 + 1] << 8 | this[t2 + 2] << 16 | this[t2 + 3] << 24;
        }, Buffer2.prototype.readInt32BE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), this[t2] << 24 | this[t2 + 1] << 16 | this[t2 + 2] << 8 | this[t2 + 3];
        }, Buffer2.prototype.readFloatLE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), K.read(this, t2, true, 23, 4);
        }, Buffer2.prototype.readFloatBE = function(t2, r3) {
          return r3 || C(t2, 4, this.length), K.read(this, t2, false, 23, 4);
        }, Buffer2.prototype.readDoubleLE = function(t2, r3) {
          return r3 || C(t2, 8, this.length), K.read(this, t2, true, 52, 8);
        }, Buffer2.prototype.readDoubleBE = function(t2, r3) {
          return r3 || C(t2, 8, this.length), K.read(this, t2, false, 52, 8);
        }, Buffer2.prototype.writeUIntLE = function(t2, r3, e2, n2) {
          if (t2 = +t2, r3 = 0 | r3, e2 = 0 | e2, !n2) {
            var i2 = Math.pow(2, 8 * e2) - 1;
            D(this, t2, r3, e2, i2, 0);
          }
          var o2 = 1, f2 = 0;
          for (this[r3] = 255 & t2; ++f2 < e2 && (o2 *= 256); ) this[r3 + f2] = t2 / o2 & 255;
          return r3 + e2;
        }, Buffer2.prototype.writeUIntBE = function(t2, r3, e2, n2) {
          if (t2 = +t2, r3 = 0 | r3, e2 = 0 | e2, !n2) {
            var i2 = Math.pow(2, 8 * e2) - 1;
            D(this, t2, r3, e2, i2, 0);
          }
          var o2 = e2 - 1, f2 = 1;
          for (this[r3 + o2] = 255 & t2; --o2 >= 0 && (f2 *= 256); ) this[r3 + o2] = t2 / f2 & 255;
          return r3 + e2;
        }, Buffer2.prototype.writeUInt8 = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 1, 255, 0), Buffer2.TYPED_ARRAY_SUPPORT || (t2 = Math.floor(t2)), this[r3] = 255 & t2, r3 + 1;
        }, Buffer2.prototype.writeUInt16LE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 2, 65535, 0), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = 255 & t2, this[r3 + 1] = t2 >>> 8) : O(this, t2, r3, true), r3 + 2;
        }, Buffer2.prototype.writeUInt16BE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 2, 65535, 0), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = t2 >>> 8, this[r3 + 1] = 255 & t2) : O(this, t2, r3, false), r3 + 2;
        }, Buffer2.prototype.writeUInt32LE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 4, 4294967295, 0), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3 + 3] = t2 >>> 24, this[r3 + 2] = t2 >>> 16, this[r3 + 1] = t2 >>> 8, this[r3] = 255 & t2) : L(this, t2, r3, true), r3 + 4;
        }, Buffer2.prototype.writeUInt32BE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 4, 4294967295, 0), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = t2 >>> 24, this[r3 + 1] = t2 >>> 16, this[r3 + 2] = t2 >>> 8, this[r3 + 3] = 255 & t2) : L(this, t2, r3, false), r3 + 4;
        }, Buffer2.prototype.writeIntLE = function(t2, r3, e2, n2) {
          if (t2 = +t2, r3 = 0 | r3, !n2) {
            var i2 = Math.pow(2, 8 * e2 - 1);
            D(this, t2, r3, e2, i2 - 1, -i2);
          }
          var o2 = 0, f2 = 1, u2 = 0;
          for (this[r3] = 255 & t2; ++o2 < e2 && (f2 *= 256); ) t2 < 0 && 0 === u2 && 0 !== this[r3 + o2 - 1] && (u2 = 1), this[r3 + o2] = (t2 / f2 >> 0) - u2 & 255;
          return r3 + e2;
        }, Buffer2.prototype.writeIntBE = function(t2, r3, e2, n2) {
          if (t2 = +t2, r3 = 0 | r3, !n2) {
            var i2 = Math.pow(2, 8 * e2 - 1);
            D(this, t2, r3, e2, i2 - 1, -i2);
          }
          var o2 = e2 - 1, f2 = 1, u2 = 0;
          for (this[r3 + o2] = 255 & t2; --o2 >= 0 && (f2 *= 256); ) t2 < 0 && 0 === u2 && 0 !== this[r3 + o2 + 1] && (u2 = 1), this[r3 + o2] = (t2 / f2 >> 0) - u2 & 255;
          return r3 + e2;
        }, Buffer2.prototype.writeInt8 = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 1, 127, -128), Buffer2.TYPED_ARRAY_SUPPORT || (t2 = Math.floor(t2)), t2 < 0 && (t2 = 255 + t2 + 1), this[r3] = 255 & t2, r3 + 1;
        }, Buffer2.prototype.writeInt16LE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 2, 32767, -32768), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = 255 & t2, this[r3 + 1] = t2 >>> 8) : O(this, t2, r3, true), r3 + 2;
        }, Buffer2.prototype.writeInt16BE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 2, 32767, -32768), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = t2 >>> 8, this[r3 + 1] = 255 & t2) : O(this, t2, r3, false), r3 + 2;
        }, Buffer2.prototype.writeInt32LE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 4, 2147483647, -2147483648), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = 255 & t2, this[r3 + 1] = t2 >>> 8, this[r3 + 2] = t2 >>> 16, this[r3 + 3] = t2 >>> 24) : L(this, t2, r3, true), r3 + 4;
        }, Buffer2.prototype.writeInt32BE = function(t2, r3, e2) {
          return t2 = +t2, r3 = 0 | r3, e2 || D(this, t2, r3, 4, 2147483647, -2147483648), t2 < 0 && (t2 = 4294967295 + t2 + 1), Buffer2.TYPED_ARRAY_SUPPORT ? (this[r3] = t2 >>> 24, this[r3 + 1] = t2 >>> 16, this[r3 + 2] = t2 >>> 8, this[r3 + 3] = 255 & t2) : L(this, t2, r3, false), r3 + 4;
        }, Buffer2.prototype.writeFloatLE = function(t2, r3, e2) {
          return N(this, t2, r3, true, e2);
        }, Buffer2.prototype.writeFloatBE = function(t2, r3, e2) {
          return N(this, t2, r3, false, e2);
        }, Buffer2.prototype.writeDoubleLE = function(t2, r3, e2) {
          return F(this, t2, r3, true, e2);
        }, Buffer2.prototype.writeDoubleBE = function(t2, r3, e2) {
          return F(this, t2, r3, false, e2);
        }, Buffer2.prototype.copy = function(t2, r3, e2, n2) {
          if (e2 || (e2 = 0), n2 || 0 === n2 || (n2 = this.length), r3 >= t2.length && (r3 = t2.length), r3 || (r3 = 0), n2 > 0 && n2 < e2 && (n2 = e2), n2 === e2) return 0;
          if (0 === t2.length || 0 === this.length) return 0;
          if (r3 < 0) throw new RangeError("targetStart out of bounds");
          if (e2 < 0 || e2 >= this.length) throw new RangeError("sourceStart out of bounds");
          if (n2 < 0) throw new RangeError("sourceEnd out of bounds");
          n2 > this.length && (n2 = this.length), t2.length - r3 < n2 - e2 && (n2 = t2.length - r3 + e2);
          var i2, o2 = n2 - e2;
          if (this === t2 && e2 < r3 && r3 < n2) for (i2 = o2 - 1; i2 >= 0; --i2) t2[i2 + r3] = this[i2 + e2];
          else if (o2 < 1e3 || !Buffer2.TYPED_ARRAY_SUPPORT) for (i2 = 0; i2 < o2; ++i2) t2[i2 + r3] = this[i2 + e2];
          else Uint8Array.prototype.set.call(t2, this.subarray(e2, e2 + o2), r3);
          return o2;
        }, Buffer2.prototype.fill = function(t2, r3, e2, n2) {
          if ("string" == typeof t2) {
            if ("string" == typeof r3 ? (n2 = r3, r3 = 0, e2 = this.length) : "string" == typeof e2 && (n2 = e2, e2 = this.length), 1 === t2.length) {
              var i2 = t2.charCodeAt(0);
              i2 < 256 && (t2 = i2);
            }
            if (void 0 !== n2 && "string" != typeof n2) throw new TypeError("encoding must be a string");
            if ("string" == typeof n2 && !Buffer2.isEncoding(n2)) throw new TypeError("Unknown encoding: " + n2);
          } else "number" == typeof t2 && (t2 = 255 & t2);
          if (r3 < 0 || this.length < r3 || this.length < e2) throw new RangeError("Out of range index");
          if (e2 <= r3) return this;
          r3 >>>= 0, e2 = void 0 === e2 ? this.length : e2 >>> 0, t2 || (t2 = 0);
          var o2;
          if ("number" == typeof t2) for (o2 = r3; o2 < e2; ++o2) this[o2] = t2;
          else {
            var f2 = Buffer2.isBuffer(t2) ? t2 : q(new Buffer2(t2, n2).toString()), u2 = f2.length;
            for (o2 = 0; o2 < e2 - r3; ++o2) this[o2 + r3] = f2[o2 % u2];
          }
          return this;
        };
        var tt = /[^+\/0-9A-Za-z-_]/g;
      }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }, { "base64-js": 30, ieee754: 32, isarray: 34 }], 30: [function(t, r, e) {
      "use strict";
      function n(t2) {
        var r2 = t2.length;
        if (r2 % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
        return "=" === t2[r2 - 2] ? 2 : "=" === t2[r2 - 1] ? 1 : 0;
      }
      function i(t2) {
        return 3 * t2.length / 4 - n(t2);
      }
      function o(t2) {
        var r2, e2, i2, o2, f2, u2, a2 = t2.length;
        f2 = n(t2), u2 = new h(3 * a2 / 4 - f2), i2 = f2 > 0 ? a2 - 4 : a2;
        var s2 = 0;
        for (r2 = 0, e2 = 0; r2 < i2; r2 += 4, e2 += 3) o2 = c[t2.charCodeAt(r2)] << 18 | c[t2.charCodeAt(r2 + 1)] << 12 | c[t2.charCodeAt(r2 + 2)] << 6 | c[t2.charCodeAt(r2 + 3)], u2[s2++] = o2 >> 16 & 255, u2[s2++] = o2 >> 8 & 255, u2[s2++] = 255 & o2;
        return 2 === f2 ? (o2 = c[t2.charCodeAt(r2)] << 2 | c[t2.charCodeAt(r2 + 1)] >> 4, u2[s2++] = 255 & o2) : 1 === f2 && (o2 = c[t2.charCodeAt(r2)] << 10 | c[t2.charCodeAt(r2 + 1)] << 4 | c[t2.charCodeAt(r2 + 2)] >> 2, u2[s2++] = o2 >> 8 & 255, u2[s2++] = 255 & o2), u2;
      }
      function f(t2) {
        return s[t2 >> 18 & 63] + s[t2 >> 12 & 63] + s[t2 >> 6 & 63] + s[63 & t2];
      }
      function u(t2, r2, e2) {
        for (var n2, i2 = [], o2 = r2; o2 < e2; o2 += 3) n2 = (t2[o2] << 16) + (t2[o2 + 1] << 8) + t2[o2 + 2], i2.push(f(n2));
        return i2.join("");
      }
      function a(t2) {
        for (var r2, e2 = t2.length, n2 = e2 % 3, i2 = "", o2 = [], f2 = 16383, a2 = 0, c2 = e2 - n2; a2 < c2; a2 += f2) o2.push(u(t2, a2, a2 + f2 > c2 ? c2 : a2 + f2));
        return 1 === n2 ? (r2 = t2[e2 - 1], i2 += s[r2 >> 2], i2 += s[r2 << 4 & 63], i2 += "==") : 2 === n2 && (r2 = (t2[e2 - 2] << 8) + t2[e2 - 1], i2 += s[r2 >> 10], i2 += s[r2 >> 4 & 63], i2 += s[r2 << 2 & 63], i2 += "="), o2.push(i2), o2.join("");
      }
      e.byteLength = i, e.toByteArray = o, e.fromByteArray = a;
      for (var s = [], c = [], h = "undefined" != typeof Uint8Array ? Uint8Array : Array, l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = 0, d = l.length; p < d; ++p) s[p] = l[p], c[l.charCodeAt(p)] = p;
      c["-".charCodeAt(0)] = 62, c["_".charCodeAt(0)] = 63;
    }, {}], 31: [function(t, r, e) {
      function n() {
        if (!(this instanceof n)) return new n();
      }
      !function(t2) {
        function e2(t3) {
          for (var r2 in s) t3[r2] = s[r2];
          return t3;
        }
        function n2(t3, r2) {
          return u(this, t3).push(r2), this;
        }
        function i(t3, r2) {
          function e3() {
            o.call(n3, t3, e3), r2.apply(this, arguments);
          }
          var n3 = this;
          return e3.originalListener = r2, u(n3, t3).push(e3), n3;
        }
        function o(t3, r2) {
          function e3(t4) {
            return t4 !== r2 && t4.originalListener !== r2;
          }
          var n3, i2 = this;
          if (arguments.length) {
            if (r2) {
              if (n3 = u(i2, t3, true)) {
                if (n3 = n3.filter(e3), !n3.length) return o.call(i2, t3);
                i2[a][t3] = n3;
              }
            } else if (n3 = i2[a], n3 && (delete n3[t3], !Object.keys(n3).length)) return o.call(i2);
          } else delete i2[a];
          return i2;
        }
        function f(t3, r2) {
          function e3(t4) {
            t4.call(o2);
          }
          function n3(t4) {
            t4.call(o2, r2);
          }
          function i2(t4) {
            t4.apply(o2, s2);
          }
          var o2 = this, f2 = u(o2, t3, true);
          if (!f2) return false;
          var a2 = arguments.length;
          if (1 === a2) f2.forEach(e3);
          else if (2 === a2) f2.forEach(n3);
          else {
            var s2 = Array.prototype.slice.call(arguments, 1);
            f2.forEach(i2);
          }
          return !!f2.length;
        }
        function u(t3, r2, e3) {
          if (!e3 || t3[a]) {
            var n3 = t3[a] || (t3[a] = {});
            return n3[r2] || (n3[r2] = []);
          }
        }
        "undefined" != typeof r && (r.exports = t2);
        var a = "listeners", s = { on: n2, once: i, off: o, emit: f };
        e2(t2.prototype), t2.mixin = e2;
      }(n);
    }, {}], 32: [function(t, r, e) {
      e.read = function(t2, r2, e2, n, i) {
        var o, f, u = 8 * i - n - 1, a = (1 << u) - 1, s = a >> 1, c = -7, h = e2 ? i - 1 : 0, l = e2 ? -1 : 1, p = t2[r2 + h];
        for (h += l, o = p & (1 << -c) - 1, p >>= -c, c += u; c > 0; o = 256 * o + t2[r2 + h], h += l, c -= 8) ;
        for (f = o & (1 << -c) - 1, o >>= -c, c += n; c > 0; f = 256 * f + t2[r2 + h], h += l, c -= 8) ;
        if (0 === o) o = 1 - s;
        else {
          if (o === a) return f ? NaN : (p ? -1 : 1) * (1 / 0);
          f += Math.pow(2, n), o -= s;
        }
        return (p ? -1 : 1) * f * Math.pow(2, o - n);
      }, e.write = function(t2, r2, e2, n, i, o) {
        var f, u, a, s = 8 * o - i - 1, c = (1 << s) - 1, h = c >> 1, l = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0, p = n ? 0 : o - 1, d = n ? 1 : -1, y = r2 < 0 || 0 === r2 && 1 / r2 < 0 ? 1 : 0;
        for (r2 = Math.abs(r2), isNaN(r2) || r2 === 1 / 0 ? (u = isNaN(r2) ? 1 : 0, f = c) : (f = Math.floor(Math.log(r2) / Math.LN2), r2 * (a = Math.pow(2, -f)) < 1 && (f--, a *= 2), r2 += f + h >= 1 ? l / a : l * Math.pow(2, 1 - h), r2 * a >= 2 && (f++, a /= 2), f + h >= c ? (u = 0, f = c) : f + h >= 1 ? (u = (r2 * a - 1) * Math.pow(2, i), f += h) : (u = r2 * Math.pow(2, h - 1) * Math.pow(2, i), f = 0)); i >= 8; t2[e2 + p] = 255 & u, p += d, u /= 256, i -= 8) ;
        for (f = f << i | u, s += i; s > 0; t2[e2 + p] = 255 & f, p += d, f /= 256, s -= 8) ;
        t2[e2 + p - d] |= 128 * y;
      };
    }, {}], 33: [function(t, r, e) {
      (function(Buffer2) {
        var t2, r2, n, i;
        !function(e2) {
          function o(t3, r3, n2) {
            function i2(t4, r4, e3, n3) {
              return this instanceof i2 ? v2(this, t4, r4, e3, n3) : new i2(t4, r4, e3, n3);
            }
            function o2(t4) {
              return !(!t4 || !t4[F]);
            }
            function v2(t4, r4, e3, n3, i3) {
              if (E && A && (r4 instanceof A && (r4 = new E(r4)), n3 instanceof A && (n3 = new E(n3))), !(r4 || e3 || n3 || g)) return void (t4.buffer = h(m, 0));
              if (!s(r4, e3)) {
                var o3 = g || Array;
                i3 = e3, n3 = r4, e3 = 0, r4 = new o3(8);
              }
              t4.buffer = r4, t4.offset = e3 |= 0, b !== typeof n3 && ("string" == typeof n3 ? x2(r4, e3, n3, i3 || 10) : s(n3, i3) ? c(r4, e3, n3, i3) : "number" == typeof i3 ? (k(r4, e3 + T, n3), k(r4, e3 + S, i3)) : n3 > 0 ? O(r4, e3, n3) : n3 < 0 ? L(r4, e3, n3) : c(r4, e3, m, 0));
            }
            function x2(t4, r4, e3, n3) {
              var i3 = 0, o3 = e3.length, f2 = 0, u2 = 0;
              "-" === e3[0] && i3++;
              for (var a2 = i3; i3 < o3; ) {
                var s2 = parseInt(e3[i3++], n3);
                if (!(s2 >= 0)) break;
                u2 = u2 * n3 + s2, f2 = f2 * n3 + Math.floor(u2 / B), u2 %= B;
              }
              a2 && (f2 = ~f2, u2 ? u2 = B - u2 : f2++), k(t4, r4 + T, f2), k(t4, r4 + S, u2);
            }
            function P() {
              var t4 = this.buffer, r4 = this.offset, e3 = _(t4, r4 + T), i3 = _(t4, r4 + S);
              return n2 || (e3 |= 0), e3 ? e3 * B + i3 : i3;
            }
            function R(t4) {
              var r4 = this.buffer, e3 = this.offset, i3 = _(r4, e3 + T), o3 = _(r4, e3 + S), f2 = "", u2 = !n2 && 2147483648 & i3;
              for (u2 && (i3 = ~i3, o3 = B - o3), t4 = t4 || 10; ; ) {
                var a2 = i3 % t4 * B + o3;
                if (i3 = Math.floor(i3 / t4), o3 = Math.floor(a2 / t4), f2 = (a2 % t4).toString(t4) + f2, !i3 && !o3) break;
              }
              return u2 && (f2 = "-" + f2), f2;
            }
            function k(t4, r4, e3) {
              t4[r4 + D] = 255 & e3, e3 >>= 8, t4[r4 + C] = 255 & e3, e3 >>= 8, t4[r4 + Y] = 255 & e3, e3 >>= 8, t4[r4 + I] = 255 & e3;
            }
            function _(t4, r4) {
              return t4[r4 + I] * U + (t4[r4 + Y] << 16) + (t4[r4 + C] << 8) + t4[r4 + D];
            }
            var T = r3 ? 0 : 4, S = r3 ? 4 : 0, I = r3 ? 0 : 3, Y = r3 ? 1 : 2, C = r3 ? 2 : 1, D = r3 ? 3 : 0, O = r3 ? l : d, L = r3 ? p : y, M = i2.prototype, N = "is" + t3, F = "_" + N;
            return M.buffer = void 0, M.offset = 0, M[F] = true, M.toNumber = P, M.toString = R, M.toJSON = P, M.toArray = f, w && (M.toBuffer = u), E && (M.toArrayBuffer = a), i2[N] = o2, e2[t3] = i2, i2;
          }
          function f(t3) {
            var r3 = this.buffer, e3 = this.offset;
            return g = null, t3 !== false && 0 === e3 && 8 === r3.length && x(r3) ? r3 : h(r3, e3);
          }
          function u(t3) {
            var r3 = this.buffer, e3 = this.offset;
            if (g = w, t3 !== false && 0 === e3 && 8 === r3.length && Buffer2.isBuffer(r3)) return r3;
            var n2 = new w(8);
            return c(n2, 0, r3, e3), n2;
          }
          function a(t3) {
            var r3 = this.buffer, e3 = this.offset, n2 = r3.buffer;
            if (g = E, t3 !== false && 0 === e3 && n2 instanceof A && 8 === n2.byteLength) return n2;
            var i2 = new E(8);
            return c(i2, 0, r3, e3), i2.buffer;
          }
          function s(t3, r3) {
            var e3 = t3 && t3.length;
            return r3 |= 0, e3 && r3 + 8 <= e3 && "string" != typeof t3[r3];
          }
          function c(t3, r3, e3, n2) {
            r3 |= 0, n2 |= 0;
            for (var i2 = 0; i2 < 8; i2++) t3[r3++] = 255 & e3[n2++];
          }
          function h(t3, r3) {
            return Array.prototype.slice.call(t3, r3, r3 + 8);
          }
          function l(t3, r3, e3) {
            for (var n2 = r3 + 8; n2 > r3; ) t3[--n2] = 255 & e3, e3 /= 256;
          }
          function p(t3, r3, e3) {
            var n2 = r3 + 8;
            for (e3++; n2 > r3; ) t3[--n2] = 255 & -e3 ^ 255, e3 /= 256;
          }
          function d(t3, r3, e3) {
            for (var n2 = r3 + 8; r3 < n2; ) t3[r3++] = 255 & e3, e3 /= 256;
          }
          function y(t3, r3, e3) {
            var n2 = r3 + 8;
            for (e3++; r3 < n2; ) t3[r3++] = 255 & -e3 ^ 255, e3 /= 256;
          }
          function v(t3) {
            return !!t3 && "[object Array]" == Object.prototype.toString.call(t3);
          }
          var g, b = "undefined", w = b !== typeof Buffer2 && Buffer2, E = b !== typeof Uint8Array && Uint8Array, A = b !== typeof ArrayBuffer && ArrayBuffer, m = [0, 0, 0, 0, 0, 0, 0, 0], x = Array.isArray || v, B = 4294967296, U = 16777216;
          t2 = o("Uint64BE", true, true), r2 = o("Int64BE", true, false), n = o("Uint64LE", false, true), i = o("Int64LE", false, false);
        }("object" == typeof e && "string" != typeof e.nodeName ? e : this || {});
      }).call(this, t("buffer").Buffer);
    }, { buffer: 29 }], 34: [function(t, r, e) {
      var n = {}.toString;
      r.exports = Array.isArray || function(t2) {
        return "[object Array]" == n.call(t2);
      };
    }, {}] }, {}, [1])(1);
  });
  var msgpack_min_default = msgpack;

  // core/utils/session.js
  var SessionStorage = class _SessionStorage {
    static prefix = "vve";
    /**
     * Imposta una nuova risorsa sul sessio storage
     * @param {string} key referenza della risorsa sul session storage
     * @param {*} value puo essere qualsiasi tanto viene compressa con msgpack
     */
    static set(key, value) {
      sessionStorage.setItem(`${_SessionStorage.prefix}-${key}`, Bytes.base64.encode(msgpack_min_default.encode(value)));
    }
    /**
     * Restituisce una risorsa dal session storage
     * @param {string} key referenza della risorsa sul session storage
     * @returns {*}
     */
    static get(key) {
      try {
        const value = sessionStorage.getItem(`${_SessionStorage.prefix}-${key}`);
        return value ? msgpack_min_default.decode(Bytes.base64.decode(value)) : null;
      } catch (error) {
        console.warn("[!] SessionStorage - get", error);
        return null;
      }
    }
    /**
     * Elimina una risorsa sul session storage
     * @param {string} key referenza della risorsa sul session storage
     */
    static remove(key) {
      sessionStorage.removeItem(`${_SessionStorage.prefix}-${key}`);
    }
  };

  // core/secure/aesgcm.js
  var AES256GCM = class {
    // mappa per gestire la configurazione delle versioni
    static versionMap = {
      1: {
        nonceLength: 12,
        tagLength: 128,
        // bit
        algorithm: "AES-GCM"
      }
    };
    // mappa di supporto per riutilizzare le stesse crypto key
    static keyMap = /* @__PURE__ */ new Map();
    /**
     * Importa una chiave AES-256-GCM da un buffer, se necessario.
     * Se riceve già una CryptoKey, la restituisce direttamente.
     *
     * @param {Uint8Array|CryptoKey} inputKey
     * @param {number} [version=1] versione utilizzata per la cifratura
     * @returns {Promise<CryptoKey>}
     */
    static async resolveKey(inputKey, version = 1) {
      if (inputKey instanceof CryptoKey) return inputKey;
      if (inputKey instanceof Uint8Array && inputKey.length === 32) {
        const cacheKey = [...inputKey].join("");
        if (this.keyMap.has(cacheKey)) return this.keyMap.get(cacheKey);
        const key = await crypto.subtle.importKey(
          "raw",
          inputKey,
          { name: this.versionMap[version].algorithm },
          false,
          ["encrypt", "decrypt"]
        );
        this.keyMap.set(cacheKey, key);
        return key;
      }
      throw new Error(
        "Formato chiave non valido, erano attesi 32 byte o una CryptoKey."
      );
    }
    /**
     * Importa e restituisce una CryptoKey partendo da 32 byte
     * @param {Uint8Array} raw 
     * @param {boolean} [exportable=false] 
     * @param {number} [version=1]
     * @returns {CryptoKey}
     */
    static async importAesGcmKey(raw, exportable = false, version = 1) {
      return await crypto.subtle.importKey(
        "raw",
        raw,
        { name: this.versionMap[version].algorithm },
        exportable,
        ["encrypt", "decrypt"]
      );
    }
    /**
     * Cifra i dati utilizzando AES-256-GCM.
     * @param {Uint8Array} data - I dati da cifrare.
     * @param {CryptoKey} key - La chiave di cifratura (32 byte per AES-256).
     * @param {*|Uint8Array} [aad=null] - informazioni aggiuntive da includere per l'autenticazione
     * @param {number} [version=1] - indica con quale versione i dati sono cifrati
     * @returns {Promise<Uint8Array>} - I dati cifrati concatenati con il nonce e il tag di autenticazione.
     */
    static async encrypt(data, key, aad = null, version = 1) {
      const nonce = crypto.getRandomValues(new Uint8Array(this.versionMap[version].nonceLength));
      const options = {
        name: this.versionMap[version].algorithm,
        iv: nonce,
        tagLength: this.versionMap[version].tagLength
      };
      const normalizedAad = this.normalizeAad(aad);
      if (normalizedAad instanceof Uint8Array) options.additionalData = normalizedAad;
      const cipher = await crypto.subtle.encrypt(
        options,
        key,
        data
      );
      const encryptedData = new Uint8Array(cipher);
      return new Uint8Array([version, ...nonce, ...encryptedData]);
    }
    /**
     * Decifra i dati con AES-256-GCM.
     * @param {Uint8Array} encrypted - I dati cifrati concatenati (nonce + dati cifrati + tag).
     * @param {CryptoKey} key - La chiave di decifratura (32 byte per AES-256).
     * @param {*|Uint8Array} [aad=null] - informazioni aggiuntive da includere per l'autenticazione
     * @returns {Promise<Uint8Array>} - I dati decifrati.
     */
    static async decrypt(encrypted, key, aad = null) {
      const version = encrypted[0];
      const nonce = encrypted.slice(1, 1 + this.versionMap[version].nonceLength);
      const encryptedData = encrypted.slice(1 + this.versionMap[version].nonceLength);
      const options = {
        name: this.versionMap[version].algorithm,
        iv: nonce,
        tagLength: this.versionMap[version].tagLength
      };
      const normalizedAad = this.normalizeAad(aad);
      if (normalizedAad instanceof Uint8Array) options.additionalData = normalizedAad;
      try {
        const decrypted = await crypto.subtle.decrypt(
          options,
          key,
          encryptedData
        );
        return new Uint8Array(decrypted);
      } catch (error) {
        throw new Error("Decryption failed: " + error.message);
      }
    }
    /**
     * Ordina e restituisce l'oggetto json, per evitare ambiguità
     * con oggetti che contengono chiavi che potrebbero essere ordinate in maniere dirrerenti
     * @param {Object} data
     * @returns {Uint8Array|null}
     */
    static normalizeAad(data) {
      return data ? data instanceof Uint8Array ? data : msgpack_min_default.encode(data) : null;
    }
  };
  window.AES256GCM = AES256GCM;

  // core/utils/local.js
  var LocalStorage = class _LocalStorage {
    static prefix = "vve";
    static key = null;
    /**
     * Salva qualcosa sul localstorage
     * @param {string} key nome di riferimento della risorsa nel local storage
     * @param {string} value 
     * @param {Uint8Array} crypto_key se un Uint8Array verrà eseguita la crittografia del value 
     */
    static async set(key, value, crypto_key = null) {
      if (crypto_key === 1) crypto_key = this.key;
      const buffer = msgpack_min_default.encode(value);
      const data = crypto_key instanceof Uint8Array ? await AES256GCM.encrypt(buffer, crypto_key) : buffer;
      localStorage.setItem(`${_LocalStorage.prefix}-${key}`, Bytes.base64.encode(data));
    }
    /**
     * Verifica se un elemento esiste nel localstorage
     * @param {string} key 
     * @returns {boolean} true se esiste false se non esiste
     */
    static exist(key) {
      return localStorage.getItem(`${_LocalStorage.prefix}-${key}`) !== null;
    }
    /**
     * Ricava qualcosa dal localstorage
     * @param {string} key nome di riferimento della risorsa nel local storage
     * @param {Uint8Array} crypto_key se diverso da null verrà eseguita la decifratura del value
     * @returns {Promise<string|Object>}
     */
    static async get(key, crypto_key = null) {
      if (crypto_key === 1) crypto_key = this.key;
      try {
        const data = localStorage.getItem(`${_LocalStorage.prefix}-${key}`);
        if (!data) return null;
        const buffer = Bytes.base64.decode(data);
        let value = crypto_key instanceof Uint8Array ? await AES256GCM.decrypt(buffer, crypto_key) : buffer;
        return msgpack_min_default.decode(value);
      } catch (error) {
        console.warn("[!] LocalStorage - get", error);
        return null;
      }
    }
    /**
     * Restituisce vero se un elemento esiste nel localstorage
     * @param {string} key 
     * @returns {boolean}
     */
    static has(key) {
      return localStorage.getItem(`${_LocalStorage.prefix}-${key}`) !== null;
    }
    /**
     * Rimuover dal localstorage un elemento
     * @param {string} key 
     */
    static remove(key) {
      localStorage.removeItem(`${_LocalStorage.prefix}-${key}`);
    }
  };

  // lib/config.js
  var Config = class {
    static dev = true;
    // ---
    static origin = this.dev ? "http://localhost:3000" : "https://vortexvault.fly.dev";
  };

  // core/secure/ecdsa.js
  var ECDSA = class _ECDSA {
    static algorithm = {
      name: "ECDSA",
      namedCurve: "P-256"
    };
    static signAlgorithm = {
      name: "ECDSA",
      hash: { name: "SHA-256" }
    };
    /**
     * Genera una coppia di chiavi ECDSA
     * @param {boolean} [exportable=true] - Se true, le chiavi saranno esportabili
     * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
     */
    static async generateKeys(exportable = true) {
      try {
        const keyPair = await crypto.subtle.generateKey(
          {
            name: _ECDSA.algorithm.name,
            namedCurve: _ECDSA.algorithm.namedCurve
          },
          exportable,
          ["sign", "verify"]
          // key usages
        );
        return {
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey
        };
      } catch (error) {
        throw new Error(`Errore nella generazione delle chiavi: ${error.message}`);
      }
    }
    /**
     * Firma un messaggio con la chiave privata
     * @param {CryptoKey} privateKey - Chiave privata per firmare
     * @param {ArrayBuffer} message - Messaggio da firmare
     * @returns {Promise<ArrayBuffer>} Firma in formato raw
     */
    static async sign(privateKey, message) {
      try {
        const signature = await crypto.subtle.sign(
          {
            name: _ECDSA.algorithm.name,
            hash: { name: _ECDSA.signAlgorithm.hash.name }
          },
          privateKey,
          message
        );
        return signature;
      } catch (error) {
        throw new Error(`Errore nella firma: ${error.message}`);
      }
    }
    /**
     * Verifica una firma con la chiave pubblica
     * @param {CryptoKey} publicKey - Chiave pubblica per verificare
     * @param {ArrayBuffer} signature - Firma da verificare
     * @param {ArrayBuffer} message - Messaggio originale
     * @returns {Promise<boolean>} True se la firma è valida
     */
    static async verify(publicKey, signature, message) {
      try {
        const isValid = await crypto.subtle.verify(
          {
            name: _ECDSA.algorithm.name,
            hash: { name: _ECDSA.signAlgorithm.hash.name }
          },
          publicKey,
          signature,
          message
        );
        return isValid;
      } catch (error) {
        throw new Error(`Errore nella verifica: ${error.message}`);
      }
    }
    /**
     * Esporta una chiave pubblica in formato raw
     * @param {CryptoKey} publicKey - Chiave pubblica da esportare
     * @returns {Promise<ArrayBuffer>} Chiave pubblica in formato raw
     */
    static async exportPublicKeyRaw(publicKey) {
      try {
        const rawKey = await crypto.subtle.exportKey(
          "raw",
          publicKey
        );
        return rawKey;
      } catch (error) {
        throw new Error(`Errore nell'esportazione della chiave pubblica: ${error.message}`);
      }
    }
    /**
     * Esporta una chiave privata in formato raw
     * @param {CryptoKey} privateKey - Chiave privata da esportare
     * @returns {Promise<ArrayBuffer>} Chiave privata in formato raw
     */
    static async exportPrivateKeyRaw(privateKey) {
      try {
        const rawKey = await crypto.subtle.exportKey(
          "pkcs8",
          privateKey
        );
        return rawKey;
      } catch (error) {
        throw new Error(`Errore nell'esportazione della chiave privata: ${error.message}`);
      }
    }
    /**
     * Importa una chiave pubblica da formato raw
     * @param {ArrayBuffer} rawPublicKey - Chiave pubblica in formato raw
     * @param {boolean} [exportable=true] - Se true, la chiave sarà esportabile
     * @returns {Promise<CryptoKey>} Chiave pubblica come CryptoKey
     */
    static async importPublicKeyRaw(rawPublicKey, exportable = true) {
      try {
        const publicKey = await crypto.subtle.importKey(
          "raw",
          rawPublicKey,
          {
            name: "ECDSA",
            namedCurve: "P-256"
          },
          exportable,
          ["verify"]
        );
        return publicKey;
      } catch (error) {
        throw new Error(`Errore nell'importazione della chiave pubblica: ${error.message}`);
      }
    }
    /**
     * Importa una chiave privata da formato PKCS8
     * @param {ArrayBuffer} rawPrivateKey - Chiave privata in formato PKCS8
     * @param {boolean} [exportable=true] - Se true, la chiave sarà esportabile
     * @returns {Promise<CryptoKey>} Chiave privata come CryptoKey
     */
    static async importPrivateKeyRaw(rawPrivateKey, exportable = true) {
      try {
        const privateKey = await crypto.subtle.importKey(
          "pkcs8",
          rawPrivateKey,
          {
            name: "ECDSA",
            namedCurve: "P-256"
          },
          exportable,
          ["sign"]
        );
        return privateKey;
      } catch (error) {
        throw new Error(`Errore nell'importazione della chiave privata: ${error.message}`);
      }
    }
  };

  // core/secure/keystore.js
  var KeyStore = class {
    constructor(dbName = "KeyStore") {
      this.dbName = dbName;
      this.db = null;
    }
    /**
     * Inizializza il database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
      if (this.db) return this.db;
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 2);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (db.objectStoreNames.contains("keys")) {
            db.deleteObjectStore("keys");
          }
          db.createObjectStore("keys", { keyPath: "name" });
        };
        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          console.warn("Aggiornamento IndexedDB bloccato. Chiudi altre schede che usano lo stesso DB.");
        };
      });
    }
    /**
     * Salva una CryptoKey (sovrascrive se esiste già)
     * @param {CryptoKey} key - Chiave da salvare
     * @param {string} name - Nome identificativo (usato come chiave primaria)
     * @returns {Promise<string>} Nome della chiave salvata
     */
    async saveKey(key, name) {
      if (!(key instanceof CryptoKey)) {
        throw new Error('Il parametro "key" deve essere una CryptoKey');
      }
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readwrite").objectStore("keys");
        const keyData = {
          name,
          // Usato come chiave primaria
          key,
          timestamp: /* @__PURE__ */ new Date()
        };
        const request = store.put(keyData);
        request.onsuccess = () => resolve(name);
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Carica una CryptoKey per nome
     * @param {string} name - Nome della chiave
     * @returns {Promise<CryptoKey|null>}
     */
    async loadKey(name) {
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readonly").objectStore("keys");
        const request = store.get(name);
        request.onsuccess = () => resolve(request.result?.key || null);
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Elimina una chiave specifica per nome
     * @param {string} name - Nome della chiave da eliminare
     * @returns {Promise<boolean>} True se eliminata, false se non esisteva
     */
    async deleteKey(name) {
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readwrite").objectStore("keys");
        const request = store.delete(name);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Ottieni tutti i nomi delle chiavi salvate
     * @returns {Promise<string[]>}
     */
    async listKeys() {
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readonly").objectStore("keys");
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Verifica se una chiave esiste
     * @param {string} name - Nome della chiave
     * @returns {Promise<boolean>}
     */
    async hasKey(name) {
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readonly").objectStore("keys");
        const request = store.getKey(name);
        request.onsuccess = () => resolve(request.result !== void 0);
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Pulisce tutte le chiavi (come localStorage.clear())
     * @returns {Promise<void>}
     */
    async clear() {
      await this.init();
      return new Promise((resolve, reject) => {
        const store = this.db.transaction(["keys"], "readwrite").objectStore("keys");
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };

  // core/secure/PoP.js
  var PoP = class _PoP {
    static keys = {};
    static keyStore = new KeyStore("AuthKeys");
    static dbPrivateKeyName = "PopPrivateKey";
    /**
     * Inizializzo PoP caricando la chiave privata dalla sessione o generandone una nuova
     * @returns {Promise<boolean>}
     */
    static async init() {
      const privateKey = await this.keyStore.loadKey(this.dbPrivateKeyName);
      if (!privateKey) return false;
      _PoP.keys.privateKey = privateKey;
      return true;
    }
    /**
     * Genera la coppia di chiavi ECDSA per il PoP
     * @returns {Promise<string>} chiave pubblica in base64 urlsafe
     */
    static async generateKeyPair() {
      const keys = await ECDSA.generateKeys(true);
      _PoP.keys.publicKey = keys.publicKey;
      const privateKey = keys.privateKey;
      const exportedPublicKey = await ECDSA.exportPublicKeyRaw(
        _PoP.keys.publicKey
      );
      const exportedPrivateKey = await ECDSA.exportPrivateKeyRaw(privateKey);
      _PoP.keys.privateKey = await ECDSA.importPrivateKeyRaw(
        exportedPrivateKey,
        false
      );
      await this.keyStore.saveKey(_PoP.keys.privateKey, this.dbPrivateKeyName);
      return Bytes.base64.encode(new Uint8Array(exportedPublicKey), true);
    }
    /**
     * Rigenera l'access token firmando un nonce
     * @returns {Promise<boolean>} true se riuscito, false se fallito
     */
    static async refreshAccessToken() {
      if (!this.keys.privateKey) return false;
      const nonceRes = await API.call("/auth/nonce", { method: "GET" });
      if (!nonceRes || !nonceRes.nonce) return null;
      const nonceBuffer = Bytes.hex.decode(nonceRes.nonce).buffer;
      const signedNonce = await ECDSA.sign(this.keys.privateKey, nonceBuffer);
      const signedNonceHex = Bytes.hex.encode(new Uint8Array(signedNonce));
      const refreshRes = await API.call("/auth/refresh", {
        method: "POST",
        body: { signedNonce: signedNonceHex, nonce: nonceRes.nonce }
      });
      if (!refreshRes) return false;
      SessionStorage.set(
        "access-token-expiry",
        new Date(Date.now() + 15 * 60 * 1e3)
      );
      return true;
    }
    /**
     * Restituisce il payload di un JWT senza verificarlo
     * @param {string} jwt
     * @returns {Object|null}
     */
    static getPayload(jwt) {
      try {
        const [payloadB64] = jwt.split(".");
        if (!payloadB64) return null;
        const payloadBuffer = Bytes.base64.decode(payloadB64, true);
        const payload = msgpack_min_default.decode(payloadBuffer);
        return payload;
      } catch (error) {
        return false;
      }
    }
  };
  window.PoP = PoP;

  // core/utils/api.js
  var API = class _API {
    static recent = {};
    // counter usato per la Chain
    static counter = 1;
    static initialized = false;
    /**
     * Inizializzo l'API, recuperando il counter dalla sessione
     */
    static init() {
      if (_API.initialized) return;
      _API.initialized = true;
      _API.counter = SessionStorage.get("api-counter") || 1;
    }
    /**
     * Wrapper per fetch che controlla e rinnova l'access token se scaduto
     * @param {string} endpoint 
     * @param {{}} options 
     * @param {string} type 
     * @returns 
     */
    static async fetch(endpoint, options = {}, type = {}) {
      const accessTokenExpiry = SessionStorage.get("access-token-expiry");
      if (accessTokenExpiry && /* @__PURE__ */ new Date() > new Date(accessTokenExpiry) && !options.skipRefresh) {
        const refreshed = await PoP.refreshAccessToken();
        if (!refreshed) {
          alert("Sessione scaduta, effettua nuovamente l'accesso");
          window.location.reload();
          return null;
        }
      }
      return await _API.call(endpoint, options, type);
    }
    /**
     * Eseguo una richiesta fetch centralizzata con endpoint, opzioni e tipo di dato.
     * @param {string} endpoint - L'endpoint a cui fare la richiesta.
     * @param {Object} options - Le opzioni da utilizzare nella chiamata fetch.
     * @param {string} [options.auth] - metodo di autenticazoine: psk, otp, psw
     * @param {boolean} [options.hide_log] - se true non mostra il log
     * @param {boolean} [options.loader] - se true attiva il loader e lo termina quando l'api risponde
     * @param {Object} type - Contiene i tipi di ritorno e contenuto: { return_type, content_type }. (json, form-data, bin)
     * @returns {Promise<any|null>} - Restituisco il risultato della chiamata o null in caso di errore.
     */
    static async call(endpoint, options = {}, type = {}) {
      try {
        options.headers = options.headers || {};
        options.headers["x-client-type"] = "extension";
        type.content_type = type.content_type || "json";
        type.return_type = type.return_type || "json";
        options.credentials = "include";
        if (options.auth) {
          options.headers["x-authentication-method"] = options.auth;
          delete options.auth;
        }
        options.headers["x-counter"] = _API.counter++;
        SessionStorage.set("api-counter", _API.counter);
        if (options.queryParams) {
          endpoint += `?${options.queryParams}`;
          delete options.queryParams;
        }
        switch (type.content_type) {
          case "json":
            options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";
            options.body = JSON.stringify(options.body);
            break;
          // ---
          case "form-data":
            options.headers["Content-Type"] = options.headers["Content-Type"] || "multipart/form-data";
            options.body = this.toFormData(options.body);
            break;
          // ---
          case "bin":
            options.headers["Content-Type"] = options.headers["Content-Type"] || "application/octet-stream";
            options.body = options.body;
            break;
          // ---
          default:
            console.warn("tipo di contenuto non gestito.");
            return null;
        }
        const response = await fetch(`${Config.origin}${endpoint}`, options);
        if (!response.ok) {
          const error = {
            status: response.status,
            status_text: response.statusText,
            error: (await response.json()).error
          };
          console.warn(`errore nella fetch:`, error);
          _API.recent = error;
          console.error(error);
          return null;
        }
        let result = null;
        switch (type.return_type) {
          case "text":
            result = await response.text();
            break;
          case "json":
            result = await response.json();
            break;
          case "binario":
            result = await response.arrayBuffer();
            break;
          default:
            result = null;
            console.warn("tipo di dato non supportato.");
            break;
        }
        return result;
      } catch (error) {
        alert(error);
        console.warn(`fetch error: `, error);
        return null;
      }
    }
    /**
     * Converto un oggetto in FormData
     * @param {Object} obj - Oggetto da convertire in FormData.
     * @returns {FormData} - Oggetto FormData creato.
     */
    static toFormData(obj) {
      const formData = new FormData();
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          formData.append(key, obj[key]);
        }
      }
      return formData;
    }
  };

  // core/service/auth.service.js
  var AuthService = class {
    /**
     * Inizializza la sessione calcolando la shared key
     */
    static async init() {
      const popInitialized = await PoP.init();
      const authInitialized = await this.startSessionWithPoP();
      return popInitialized && authInitialized;
    }
    /**
     * Tenta di avviare automaticamente una sessione
     * @returns {number} true è stato loggato e la sessione è stata attivata, 0 già loggato, -1 nuovo access token non ottenuto, -2 nessuna chiave restituita, false sessione non attivata
     */
    static async startSession(ckeKeyBasic) {
      const session_storage_init = SessionStorage.get("master-key") !== null;
      const signin_need = !session_storage_init;
      if (!signin_need) return 0;
      if (!ckeKeyBasic) ckeKeyBasic = await CKE.getBasic();
      if (!ckeKeyBasic) {
        console.log("CKE non ottenuta.");
        return false;
      }
      const initialized = await this.configSessionVariables(ckeKeyBasic);
      return initialized;
    }
    /**
     * Imposta la chiave master dell'utente nel session storage
     * @param {Uint8Array} ckeKeyAdvanced 
     */
    static async configSessionVariables(ckeKeyAdvanced) {
      const KEK = await LocalStorage.get("master-key", ckeKeyAdvanced);
      const DEK = await LocalStorage.get("DEK", ckeKeyAdvanced);
      const salt = await LocalStorage.get("salt", ckeKeyAdvanced);
      const email = await LocalStorage.get("email-utente");
      if (!KEK || !DEK) return false;
      SessionStorage.set("cke", ckeKeyAdvanced);
      SessionStorage.set("master-key", KEK);
      SessionStorage.set("DEK", DEK);
      SessionStorage.set("salt", salt);
      SessionStorage.set("email", email);
      return true;
    }
    /**
     * Esegue l'accesso
     * @param {string} email
     * @param {string} password
     * @returns {boolean}
     */
    static async signin(email, password) {
      const publicKeyB64 = await PoP.generateKeyPair();
      const obfuscatedPassword = await Cripto.obfuscatePassword(password);
      const res = await API.fetch("/auth/signin", {
        method: "POST",
        body: {
          email,
          password: obfuscatedPassword,
          publicKey: publicKeyB64
        },
        skipRefresh: true
      });
      if (!res) return false;
      const { dek: encodedDek } = res;
      const salt = Bytes.hex.decode(res.salt);
      const rawKEK = await Cripto.deriveKey(password, salt);
      const KEK = await AES256GCM.importAesGcmKey(rawKEK, false);
      const encryptedDEK = Bytes.base64.decode(encodedDek);
      const rawDEK = await AES256GCM.decrypt(encryptedDEK, KEK);
      const DEK = await AES256GCM.importAesGcmKey(rawDEK, false);
      SessionStorage.set(
        "access-token-expiry",
        new Date(Date.now() + 15 * 60 * 1e3)
      );
      LocalStorage.set("salt", salt);
      LocalStorage.set("email", email);
      await VaultService.keyStore.saveKey(KEK, "KEK");
      await VaultService.keyStore.saveKey(DEK, "DEK");
      return true;
    }
    /**
     * Effettua il logout eliminando ogni traccia dell'utente dal client
     */
    static async signout() {
      const res = await API.fetch("/auth/signout", {
        method: "POST"
      });
      if (!res) return false;
      localStorage.clear();
      sessionStorage.clear();
      return true;
    }
    /**
     * Refresha l'access token in automatico usando la chiave privata pop
     * @returns {boolean} true è stato loggato e la sessione è stata attivata, 0 già loggato, -1 nuovo access token non ottenuto, -2 nessuna chiave restituita, false sessione non attivata
     */
    static async startSessionWithPoP() {
      const accessTokenExpiry = SessionStorage.get("access-token-expiry");
      if (accessTokenExpiry) return true;
      const accessTokenRefreshed = await PoP.refreshAccessToken();
      if (!accessTokenRefreshed) return false;
      SessionStorage.set("email", await LocalStorage.get("email"));
      SessionStorage.set("salt", await LocalStorage.get("salt"));
      return true;
    }
  };

  // core/service/vault.local.js
  var VaultLocal = class {
    // Implement the necessary methods for interacting with the local vault
    static async save(vaults, key = null) {
      await LocalStorage.set("vaults", vaults, key);
    }
    /**
     * Restituisce un vault dal localstorage
     * @param {Uint8Array} key 
     * @returns {Array<Object>}
     */
    static async get(key = null) {
      return await LocalStorage.get("vaults", key) ?? [];
    }
    /**
     * Elimina un vault sul localstorage
     * @param {string} vault_id 
     */
    static delete(vault_id, key = null) {
      const vaults = this.get(key);
      const index = this.get_index(vaults, vault_id);
      vaults.splice(index, 1);
      this.save(vaults);
    }
    /**
     * Restituisce l'index di un vault
     * @param {Array<Object>} vaults 
     * @param {string} vault_id 
     * @returns {string}
     */
    static get_index(vaults, vault_id) {
      return vaults.findIndex((vault) => vault.id === vault_id);
    }
    /**
     * Aggiorna tutti i vaults passati o li aggiunge se non esistono
     * @param {Array<Object>} vaults 
     * @param {Uint8Array} key 
     */
    static async sync_update(vaults, key) {
      let local_vaults = await this.get(key);
      const vaultMap = new Map(local_vaults.map((v) => [v.id, v]));
      for (const vault of vaults) {
        if (vault.deleted) {
          vaultMap.delete(vault.id);
        } else {
          vaultMap.set(vault.id, vault);
        }
      }
      const updatedVaults = Array.from(vaultMap.values());
      await this.save(updatedVaults, key);
      console.log(`[sync_update] Total received: ${vaults.length}, Deleted: ${vaults.filter((v) => v.deleted).length}`);
      return updatedVaults;
    }
    /**
     * Aggiorna il singolo vault
     * @param {Object} vault 
     * @param {Uint8Array} key 
     */
    static update(vault, key) {
      const vault_id = vault.id;
      const local_vaults = this.get(key);
      const index = this.get_index(local_vaults, vault_id);
      index !== -1 ? local_vaults.push(vault) : local_vaults[index] = vault;
      this.save(local_vaults);
      return true;
    }
  };

  // core/service/vault.service.js
  var VaultService2 = class _VaultService {
    static keyStore = new KeyStore("VaultKeys");
    // POPUP VAR
    static info = null;
    // -----
    static KEK = null;
    static DEK = null;
    static salt = null;
    static vaults = [];
    // Tempo da rimuovere da Date.now() per ottenere i vault piu recenti
    static getDateDiff = 30 * 60 * 1e3;
    /**
     * 
     */
    static async init(full = false) {
      this.info = document.querySelector("#signin-info");
      const configured = await _VaultService.configSecrets();
      if (!configured) return false;
      const initialized = await _VaultService.syncronize(full);
      if (initialized) {
        console.log("Vault initialized");
        await chrome.storage.session.set({ vaults: _VaultService.vaults });
        return true;
      }
      return initialized;
    }
    /**
     * Configura i segreti necessari ad utilizzare il vault
     * @returns {boolean} - true se entrambi sono presenti
     */
    static async configSecrets() {
      const accessTokenExpiry = SessionStorage.get("access-token-expiry");
      if (accessTokenExpiry === null) return false;
      this.KEK = await this.keyStore.loadKey("KEK");
      this.DEK = await this.keyStore.loadKey("DEK");
      this.salt = await LocalStorage.get("salt");
      return this.KEK && this.DEK && this.salt ? true : false;
    }
    /**
     * Sincronizza e inizializza il Vault con il db
     * @param {boolean} full - sincronizzazione completa true, false sincronizza solo il necessario
     * @returns {boolean} true per processo completato con successo
     */
    static async syncronize(full = false) {
      const configured = await this.configSecrets();
      if (!configured)
        return alert("Nessuna chiave crittografica trovata, effettua il login.");
      const vault_update = await LocalStorage.get("vault-update") ?? null;
      let selectFrom = null;
      if (vault_update) selectFrom = new Date(Date.now() - this.getDateDiff);
      this.vaults = await VaultLocal.get(this.DEK);
      if (this.vaults.length === 0) {
        console.log("[i] Sincronizzo completamente con il vault");
        full = true;
      }
      try {
        const vaults_from_db = await this.get(full ? null : selectFrom);
        if (vaults_from_db.length > 0) {
          if (full) {
            await VaultLocal.save(
              vaults_from_db.filter((vault) => {
                return vault.deleted == false;
              }),
              this.DEK
            );
            this.vaults = vaults_from_db;
          } else {
            this.vaults = await VaultLocal.sync_update(
              vaults_from_db,
              this.DEK
            );
          }
        } else {
          if (full) await VaultLocal.save([], this.DEK);
        }
      } catch (error) {
        console.warn("Sync Error - Vault => ", error);
        LocalStorage.remove("vault-update");
        LocalStorage.remove("vaults");
        return false;
      }
      return true;
    }
    /**
     * Restituisce tutti i vault che sono stati aggiorati dopo una certa data
     * @param {Date} updated_after - opzionale, se nullo restituirà tutti i vault
     * @returns {Array<Object>} un array di oggetti vault
     */
    static async get(updated_after = null) {
      const res = await API.fetch("/vaults", {
        method: "GET",
        queryParams: updated_after ? `updated_after=${updated_after.toISOString()}` : null
      });
      if (!res) return null;
      if (res.length > 0) LocalStorage.set("vault-update", /* @__PURE__ */ new Date());
      return await this.decryptAllVaults(res) ? res : null;
    }
    /**
     * Cifra un vault
     * @param {Object} vault
     * @param {Uint8Array} [DEK=this.DEK] 
     * @returns {Uint8Array}
     */
    static async encrypt(vault, DEK = this.DEK) {
      const encodedVault = msgpack_min_default.encode(vault);
      const encryptedVault = await AES256GCM.encrypt(encodedVault, DEK);
      return encryptedVault;
    }
    /**
     * Decifra un vault
     * @param {Uint8Array} encrypted
     * @param {Uint8Array} DEK
     * @return {Object} - il vault decifrato insieme alla DEK cifrata
     */
    static async decrypt(encryptedVault, DEK = this.DEK) {
      const decryptedVault = await AES256GCM.decrypt(encryptedVault, DEK);
      return msgpack_min_default.decode(decryptedVault);
    }
    /**
     * Compatta i vaults per renderli pronti all esportazione
     * @returns {Array<Object>} l'array dei vault compattati
     */
    static compactVaults(vaults = this.vaults) {
      return vaults.map((vault) => {
        const { secrets: S, createdAt: C, updatedAt: U } = vault;
        return { S, C, U };
      });
    }
    /**
     * Decompatta i vaults per renderli nuovamente utilizzabili
     * @param {Array<Object>} compacted_vaults
     */
    static decompactVaults(compacted_vaults) {
      return compacted_vaults.map((vault) => {
        const { S: secrets, C: createdAt, U: updatedAt } = vault;
        return { secrets, createdAt, updatedAt };
      });
    }
    /**
     * Decifra tutti i vault
     * @param {Array<Object>} vaults - array dei vari vault
     */
    static async decryptAllVaults(vaults) {
      if (vaults instanceof Array === false || vaults.length === 0)
        return true;
      let i = 0;
      try {
        for (i = 0; i < vaults.length; i++) {
          const encryptedSecrets = new Uint8Array(vaults[i].secrets.data);
          const secrets = await this.decrypt(encryptedSecrets);
          vaults[i].secrets = secrets;
        }
      } catch (error) {
        console.warn(`Decrypt Vault error at i = ${i}:`, error);
        return false;
      }
      return true;
    }
    /**
     * MESSAGGI CON IL BACKGROUND
     */
    /**
     * Invia i vault al background
     * @returns {Promise<boolean>} true se il vault è stato salvato con successo
     */
    static async sendVaultToBackground() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "store-vault", payload: this.vaults }, (res) => {
          resolve(!!res?.success);
        });
      });
    }
    /**
     * Controlla lo stato dei vaults
     * @returns {Promise<boolean>} true se i vault sono già in memoria, false altrimenti
     */
    static async checkVaultStatus() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "check-vault-status" }, (res) => {
          resolve(!!res?.hasVault);
        });
      });
    }
  };
  window.VaultService = VaultService2;

  // core/service/secure-link.js
  var SecureLink = class {
    /**
     * Genera un nuovo link sicuro
     * @param {Object} options
     * @param {Uint8Array} [options.key] 
     * @param {string} [options.id] 
     * @param {string} [options.scope] *
     * @param {number} [options.ttl] * time to live
     */
    static async generate(options) {
      const rawKey = options.key instanceof Uint8Array ? options.key : Cripto.randomBytes(32);
      const key = await AES256GCM.importAesGcmKey(rawKey);
      const data = msgpack_min_default.encode(options.data);
      const encrypted_data = await AES256GCM.encrypt(data, key);
      const res = await API.fetch("/secure-link/", {
        method: "POST",
        body: {
          id: options.id ?? null,
          scope: options.scope ?? "",
          ttl: options.ttl ?? 60 * 5,
          data: Bytes.base64.encode(encrypted_data)
        }
      });
      if (!res) return false;
      return {
        id: res.id,
        key: Bytes.base64.encode(rawKey, true)
      };
    }
    /**
     * Richiede un id utilizzabile nel RedisDB
     * @returns {string} id della risorsa
     */
    static async request_id() {
      const res = await API.fetch("/secure-link/id", {
        method: "POST"
      });
      if (!res) return false;
      return res.id;
    }
    /**
     * Restituisce il contenuto di un link sicuro
     * @param {string} scope
     * @param {string} id 
     * @param {Uint8Array|string} key_ 
     */
    static async get(scope, id, key_) {
      const res = await API.fetch(`/secure-link/${scope}_${id}`, {
        method: "GET"
      });
      if (!res) return false;
      const rawKey = key_ instanceof Uint8Array ? key_ : Bytes.base64.decode(key_, true);
      const key = await AES256GCM.importAesGcmKey(rawKey);
      const decoded_data = Bytes.base64.decode(res.data);
      const data = await AES256GCM.decrypt(decoded_data, key);
      return msgpack_min_default.decode(data);
    }
  };

  // popup.js
  document.addEventListener("DOMContentLoaded", async () => {
    const info = document.querySelector("#signin-info");
    info.innerHTML = "Avvio in corso dell'estensione...";
    const sessionInitialized = await AuthService.init();
    if (sessionInitialized) {
      PopupUI.init(false);
      VaultService2.init();
    } else {
      info.innerHTML = "Sign-in is needed";
      document.querySelector("#signin").addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = document.getElementById("token").value;
        const [id, key] = new TextDecoder().decode(Bytes.base32.decode(token)).split(".");
        try {
          const [email, password] = await SecureLink.get("ext-signin", id, key);
          if (await AuthService.signin(email, password)) {
            e.target.reset();
            PopupUI.init(false);
            VaultService2.init();
          }
        } catch (error) {
          alert("Errore durante l'accesso, verifica l'errore nelle informazioni");
          info.textContent = error;
        }
      });
    }
    const vaultInfo = document.getElementById("vault-info");
    document.getElementById("logout-btn").addEventListener("click", async () => {
      if (!confirm("Signout?")) return;
      await AuthService.signout();
      PopupUI.init(true);
    });
    document.getElementById("smartsync-btn").addEventListener("click", async () => {
      vaultInfo.innerHTML = "Downloading latest data from your vault...";
      if (await VaultService2.syncronize(false)) {
        setTimeout(() => {
          vaultInfo.innerHTML = "Vault is up to date";
        }, 2e3);
      } else {
        vaultInfo.innerHTML = "Something went wrong, try 'full sync' instead";
      }
    });
    document.getElementById("fullsync-btn").addEventListener("click", async () => {
      if (!confirm("Are you sure you want to fully synchronize with the server?")) return;
      vaultInfo.innerHTML = "Downloading all data from your vault...";
      if (await VaultService2.syncronize(true)) {
        setTimeout(() => {
          vaultInfo.innerHTML = "Vault is up to date";
        }, 2e3);
      } else {
        vaultInfo.innerHTML = "Something went wrong, you may need to log in again";
      }
    });
  });
  var PopupUI = class {
    static activeDisplay = "";
    static async init(logout = false) {
      document.querySelector("#signin").style.display = logout ? "" : "none";
      document.querySelector("#app").style.display = logout ? "none" : "";
      const email = await LocalStorage.get("email-utente");
      if (!email) return;
      document.querySelector("#user-email").textContent = email.split("@")[0];
    }
  };
})();
