import { Bytes } from "../utils/bytes.js";
import { Cripto } from "../secure/cripto.js";
import { SessionStorage } from "../utils/session.js";
import { LocalStorage } from "../utils/local.js";
import { API } from "../utils/api.js";
import { PoP } from "../secure/PoP.js";
import { AES256GCM } from "../secure/aesgcm.js";

export class AuthService {
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
        // -- con questa condizione capisco se ce bisogno di accedere o meno
        const signin_need = !session_storage_init;
        // -- nessuna necessita di accedere
        if (!signin_need) return 0;
        // ---
        /**
         * TODO: quando funziona nuovamente passkey rimettere ckeAdvanced
         */
        // const ckeKeyAdvanced = await CKE.getAdvanced();
        if (!ckeKeyBasic) ckeKeyBasic = await CKE.getBasic();
        // -- verifico
        if (!ckeKeyBasic) {
            console.log("CKE non ottenuta.");
            return false;
        }
        // -- imposto le variabili di sessione
        const initialized = await this.configSessionVariables(ckeKeyBasic);
        // ---
        return initialized;
    }
    /**
     * Imposta la chiave master dell'utente nel session storage
     * @param {Uint8Array} ckeKeyAdvanced 
     */
    static async configSessionVariables(ckeKeyAdvanced) {
        const KEK = await LocalStorage.get('master-key', ckeKeyAdvanced);
        const DEK = await LocalStorage.get('DEK', ckeKeyAdvanced);
        const salt = await LocalStorage.get('salt', ckeKeyAdvanced);
        const email = await LocalStorage.get('email');
        if (!KEK || !DEK) return false;
        // ---
        SessionStorage.set('cke', ckeKeyAdvanced);
        SessionStorage.set('master-key', KEK);
        SessionStorage.set('DEK', DEK);
        SessionStorage.set('salt', salt);
        SessionStorage.set('email', email);
        // ---
        return true;
    }
    /**
     * Esegue l'accesso
     * @param {string} email
     * @param {string} password
     * @returns {boolean}
     */
    static async signin(email, password) {
        // -- genero la coppia di chiavi
        const publicKeyB64 = await PoP.generateKeyPair();
        const obfuscatedPassword = await Cripto.obfuscatePassword(password);
        // ---
        const res = await API.fetch("/auth/signin", {
            method: "POST",
            body: {
                email,
                password: obfuscatedPassword,
                publicKey: publicKeyB64,
            },
            skipRefresh: true,
        });
        if (!res) return false;
        // ---
        const { dek: encodedDek } = res;
        // -- derivo la chiave crittografica
        const salt = Bytes.hex.decode(res.salt);
        // ---
        const rawKEK = await Cripto.deriveKey(password, salt);
        const KEK = await AES256GCM.importAesGcmKey(rawKEK, false);
        // ---
        const encryptedDEK = Bytes.base64.decode(encodedDek);
        const rawDEK = await AES256GCM.decrypt(encryptedDEK, KEK);
        const DEK = await AES256GCM.importAesGcmKey(rawDEK, false);
        // -- imposto in chiaro sul session storage
        SessionStorage.set(
            "access-token-expiry",
            new Date(Date.now() + 15 * 60 * 1000)
        );
        LocalStorage.set("salt", salt);
        LocalStorage.set("email", email);
        await VaultService.keyStore.saveKey(KEK, "KEK");
        await VaultService.keyStore.saveKey(DEK, "DEK");
        // ---
        return true;
    }

    /**
     * Effettua il logout eliminando ogni traccia dell'utente dal client
     */
    static async signout() {
        const res = await API.fetch("/auth/signout", {
            method: "POST",
        });
        if (!res) return false;
        // ---
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
        // ---
        const accessTokenRefreshed = await PoP.refreshAccessToken();
        if (!accessTokenRefreshed) return false;
        // -- imposto le variabili di sessione
        SessionStorage.set("email", await LocalStorage.get("email"));
        SessionStorage.set("salt", await LocalStorage.get("salt"));
        return true;
    }
}
