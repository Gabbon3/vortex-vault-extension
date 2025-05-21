import { Bytes } from "../utils/bytes.js";
import { Cripto } from "../secure/cripto.js";
import { SessionStorage } from "../utils/session.js";
import { LocalStorage } from "../utils/local.js";
import { API } from "../utils/api.js";
import { CKE } from "../utils/cke.public.util.js";
import { SHIV } from "../secure/SHIV.browser.js";

export class AuthService {
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
        // ---
        const res = await API.fetch('https://vortexvault.fly.dev/auth/signin', {
            method: 'POST',
            body: {
                email,
                password,
                publicKey: publicKeyHex,
            },
        });
        if (!res) return false;
        // ---
        const { publicKey: serverPublicKey, bypassToken } = res;
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
        const master_key = await Cripto.deriveKey(password, salt);
        // -- cifro le credenziali sul localstorage
        await LocalStorage.set('email-utente', email);
        await LocalStorage.set('password-utente', password, master_key);
        await LocalStorage.set('master-key', master_key, keyAdvanced);
        await LocalStorage.set('salt', salt, keyAdvanced);
        // -- imposto quelle in chiaro sul session storage
        SessionStorage.set('master-key', master_key);
        SessionStorage.set('salt', salt);
        SessionStorage.set('uid', res.uid);
        // ---
        return true;
    }
}