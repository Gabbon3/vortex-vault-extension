import { Bytes } from "../utils/bytes.js";
import { API } from "../utils/api.js";
import msgpack from "../utils/msgpack.min.js";
import { Config } from "../../lib/config.js";

export class PasskeyService {
    /**
     * Fa firmare una challenge generata dal server per validare la passkey restituendo gli auth data
     * @returns {object} request id (per identificare la richiesta) e auth data (per autenticarsi)
     */
    static async get_auth_data() {
        const chl_req_id = await API.fetch(`${Config.origin}/auth/passkey/`, {
            method: "GET",
        });
        if (!chl_req_id) return false;
        // ---
        const { request_id, challenge: challenge_base64, credentials_id } = chl_req_id;
        // -- decodifico la challenge
        const challenge = Bytes.base64.decode(challenge_base64);
        // -- restituisco le credenziali disponibili
        let allowCredentials = null;
        if (credentials_id instanceof Array && credentials_id.length > 0) {
            allowCredentials = credentials_id.map(cred_id => ({
                type: 'public-key',
                id: Bytes.base64.decode(cred_id, true),
                transports: ["internal"],
            }));
        }
        // -- creo l'oggetto per la richiesta di autenticazione
        const publicKey = {
            challenge,
            userVerification: "preferred",
            timeout: 60000,
        };
        // ---
        if (allowCredentials) publicKey.allowCredentials = allowCredentials;
        // -- seleziono la passkey e firmo
        let credential = null;
        try {
            credential = await navigator.credentials.get({ publicKey });
        } catch (error) {
            console.warn('Passkey auth request Aborted', error);
            return null;
        } 
        // -- restituisco i dati grazie al quale il server può validare la passkey
        const auth_data = {
            request_id,
            id: credential.id,
            rawId: new Uint8Array(credential.rawId),
            response: {
                authenticatorData: new Uint8Array(credential.response.authenticatorData),
                clientDataJSON: new Uint8Array(credential.response.clientDataJSON),
                signature: new Uint8Array(credential.response.signature),
            },
            userHandle: credential.response.clientDataJSON.userHandle,
        };
        return auth_data;
    }
    /**
     * Effettua in maniera dinamica un'autenticazione tramite passkey indicando l'endpoint necessario
     * @param {object} options 
     * @param {string} [options.endpoint] qualsiasi endpoint del server
     * @param {string} [options.method] POST, GET...
     * @param {object} [options.body], dati 
     * @returns {boolean}
     */
    static async authenticate(options) {
        if (!options.endpoint) return false;
        // -- verifico che il body non contenga le opzioni usate già dal service per far funzionare l'autenticazione
        if (options.body && (options.body.request_id || options.body.auth_data)) throw new Error("Invalid options properties, request_id & auth_data can't be used in this context");
        /**
         * Verifico se l'utente si è già autenticato di recente con la passkey
         */
        let auth_data = null;
        let request_id = null;
        let body = options.body ?? {};
        const bypassToken = options.body?.bypassToken ? true : false;
        // -- definisco dei valori predefiniti delle options
        const opt = {
            method: 'POST',
            ...options,
        };
        /**
         * se è presente un bypass token skippo questa parte
         * Se non si è già autenticato chiedo al client di firmare una challenge
         */
        if (bypassToken === false) {
            // -- ottengo gli auth data e la request id
            auth_data = await this.get_auth_data();
            if (!auth_data) return auth_data;
            // -- ottengo l'id della richiesta per farla identificare dal middleware
            request_id = auth_data.request_id;
            delete auth_data.request_id;
            // --
            body = {
                ...body,
                request_id,
                auth_data: Bytes.base64.encode(msgpack.encode(auth_data)),
            }
        }
        // -- invio all'endpoint scelto la risposta
        const response = await API.fetch(opt.endpoint, {
            method: opt.method,
            body,
            auth: 'psk',
        });
        // -- se ce stato un errore probabilmente è per la passkey
        // - quindi elimino dal localstorage la traccia di passkey token cosi alla prossima richiesta l'utente usa la passkey
        if (!response) return false;
        // -- passo alla callback la risposta
        return response;
    }
}