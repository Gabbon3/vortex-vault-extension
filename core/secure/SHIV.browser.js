import { Cripto } from "./cripto.js";
import { Bytes } from "../utils/bytes.js";
import { ECDH } from "./ecdh.js";
import { SessionStorage } from "../utils/session.js";
import msgpack from "../utils/msgpack.min.js";

/**
 * Session Handshake w/ Integrity Verification
 */
export class SHIV {
    // usato per memorizzare la vecchia chiave
    static recentKey = null;
    // ---
    static clientPrivateKey = null;
    static clientPublicKey = null;
    static clientPublicKeyHex = null;
    // 
    static timeWindow = 120;
    /**
     * Restituisce la stringa di integrità 
     * da associare alle fetch come header
     * @param {string} method - metodo usato per la fetch (GET, POST...)
     * @param {string} endpoint - endpoint su cui verrà effettuata la fetch
     * @returns {string} stringa esadecimale dell'integrità
     */
    static async getIntegrity(method = "", endpoint = "") {
        // -- ottengo la chiave dal session storage
        const sharedSecret = SessionStorage.get('shared-secret');
        // ---
        if (sharedSecret instanceof Uint8Array == false) return null;
        // -- genero un salt casuale
        const salt = Cripto.random_bytes(12);
        // -- codifico le variabili del payload
        const encodedMethod = new TextEncoder().encode(method.toLowerCase());
        const encodedEndpoint = new TextEncoder().encode(this.normalizeEndpoint(endpoint));
        // -- mergio tutto il payload
        const payload = Bytes.merge([salt, encodedMethod, encodedEndpoint], 8);
        // -- ottengo la chiave nuova
        const derivedKey = await this.deriveKey(sharedSecret, salt);
        // -- genero la firma
        const encrypted = await Cripto.hmac(payload, derivedKey);
        const result = Bytes.merge([salt, encrypted], 8);
        return Bytes.base64.encode(result, true);
    }

    /**
     * Normalizza un path preparandolo alla firma di integrità
     * rimuove slash finali e query params, forza lower case
     * @param {string} path 
     * @returns {string}
     */
    static normalizeEndpoint(endpoint) {
        return endpoint.split('?')[0].replace(/\/+$/, '').toLowerCase();
    }

    /**
     * Genera e imposta le chiavi da usare per l'handshake con il server
     * @returns {boolean}
     */
    static async generateKeyPair() {
        const keyPair = await ECDH.generate_keys();
        // ---
        this.clientPrivateKey = keyPair.private_key[0];
        // -
        this.clientPublicKey = keyPair.public_key[0];
        this.clientPublicKeyHex = Bytes.hex.encode(keyPair.public_key[1]);
        // ---
        return this.clientPublicKeyHex;
    }

    /**
     * Deriva il segreto condiviso con il server
     * @param {string} serverPublicKeyHex in esadecimale
     */
    static async deriveSharedSecret(serverPublicKeyHex) {
        const serverPublicKey = await ECDH.import_public_key(
            Bytes.hex.decode(serverPublicKeyHex)
        );
        // ---
        const sharedSecret = await ECDH.derive_shared_secret(
            this.clientPrivateKey,
            serverPublicKey
        );
        // --
        return await Cripto.hash(sharedSecret);
    }

    /**
     * Deriva la chiave sfruttando le finestre temporali
     * @param {Uint8Array} sharedKey 
     *@param {Uint8Array} salt - 
     * @param {number} [interval=60] intervallo di tempo in secondi, di default a 1 ora
     * @param {number} [shift=0] con 0 si intende l'intervallo corrente, con 1 il prossimo intervallo, con -1 il precedente
     */
    static async deriveKey(sharedKey, salt, interval = SHIV.timeWindow, shift = 0) {
        const int = Math.floor(((Date.now() / 1000) + (shift * interval)) / interval);
        const windowIndex = new TextEncoder().encode(`${int}`);
        // ---
        return await Cripto.HKDF(sharedKey, salt, windowIndex);
    }

    /**
     * Completa l'handshake calcolando tutto il necessario in locale
     * @param {string} serverPublicKeyHex 
     * @returns {boolean | Uint8Array}
     */
    static async completeHandshake(serverPublicKeyHex) {
        // -- derivo il segreto condiviso
        const sharedSecret = await this.deriveSharedSecret(serverPublicKeyHex);
        if (!sharedSecret) return false;
        // -- setto localmente
        SessionStorage.set('shared-secret', sharedSecret);
        // ---
        return sharedSecret;
    }
}