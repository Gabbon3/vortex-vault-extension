import { Bytes } from "../utils/bytes.js";
import { Cripto } from "../secure/cripto.js";
import { SessionStorage } from "../utils/session.js";
import { LocalStorage } from "../utils/local.js";
import { API } from "../utils/api.js";
import { CKE } from "../utils/cke.public.util.js";
import { SHIV } from "../secure/SHIV.browser.js";
import { AES256GCM } from "../secure/aesgcm.js";

export class AuthService {
    /**
     * Inizializza la sessione calcolando la shared key
     */
    static async init() {
        /**
         * CKE
         */
        const sessionSharedSecret = SessionStorage.get("shared-secret");
        if (sessionSharedSecret) {
            console.log('Session already ok');
            return true;
        }
        // ---
        const keyBasic = await CKE.getBasic();
        if (!keyBasic) return false;
        // ---
        const sharedSecret = await LocalStorage.get("shared-secret", keyBasic);
        if (!sharedSecret) return false;
        // ---
        SessionStorage.set("shared-secret", sharedSecret);
        console.log("SHIV started");
        // ---
        return this.startSession();
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
        const email = await LocalStorage.get('email-utente');
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
     * @param {boolean} [activate_lse=false] true per abilitare il protocollo lse
     * @returns {boolean}
     */
    static async signin(email, password) {
        // -- genero la coppia di chiavi
        const publicKeyHex = await SHIV.generateKeyPair();
        const obfuscatedPassword = await Cripto.obfuscatePassword(password);
        // ---
        const res = await API.fetch('/auth/signin', {
            method: 'POST',
            body: {
                email,
                password: obfuscatedPassword,
                publicKey: publicKeyHex,
            },
        });
        if (!res) return false;
        // ---
        const { dek: encodedDek, publicKey: serverPublicKey, bypassToken } = res;
        // -- ottengo il segreto condiviso e lo cifro in localstorage con CKE
        const sharedSecret = await SHIV.completeHandshake(serverPublicKey);
        if (!sharedSecret) return false;
        /**
         * Inizializzo CKE localmente
         */
        const { keyBasic, keyAdvanced } = await CKE.set(bypassToken);
        if (!keyBasic || !keyAdvanced) return false;
        // -- cifro localmente lo shared secret con la chiave basic
        LocalStorage.set('shared-secret', sharedSecret, keyBasic);
        // -- derivo la chiave crittografica
        const salt = Bytes.hex.decode(res.salt);
        const KEK = await Cripto.deriveKey(password, salt);
        // ---
        const encryptedDEK = Bytes.base64.decode(encodedDek);
        const DEK = await AES256GCM.decrypt(encryptedDEK, KEK);
        // -- cifro le credenziali sul localstorage
        await LocalStorage.set('email-utente', email);
        await LocalStorage.set('password-utente', password, KEK);
        await LocalStorage.set('master-key', KEK, keyBasic);
        await LocalStorage.set('DEK', DEK, keyBasic);
        await LocalStorage.set('salt', salt, keyBasic);
        // -- imposto quelle in chiaro sul session storage
        SessionStorage.set('master-key', KEK);
        SessionStorage.set('DEK', DEK);
        SessionStorage.set('salt', salt);
        SessionStorage.set('uid', res.uid);
        // ---
        return true;
    }

    /**
     * Effettua il logout eliminando ogni traccia dell'utente dal client
     */
    static async signout() {
        const res = await API.fetch('/auth/signout', {
            method: 'POST',
        });
        if (!res) return false;
        // ---
        localStorage.clear();
        sessionStorage.clear();
        await chrome.storage.session.clear();
        return true;
    }
}
