import { Config } from "../../lib/config.js";
import { SHIV } from "../secure/SHIV.browser.js";

export class API {
    static recent = {};
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
    static async fetch(endpoint, options = {}, type = {}) {
        try {
            // -- imposto le intestazioni e il tipo di contenuto per la richiesta
            options.headers = options.headers || {};
            type.content_type = type.content_type || 'json';
            type.return_type = type.return_type || 'json';
            options.credentials = "include";
            // -- imposto il metodo di autenticazione se presente
            if (options.auth) {
                options.headers['x-authentication-method'] = options.auth;
                delete options.auth;
            }
            // -- aggiungo l'header integrity se presente
            const integrity = await SHIV.getIntegrity(options.body ?? {}, options.method, endpoint);
            if (integrity) {
                options.headers['X-Integrity'] = integrity;
            }
            // IMPORTANTE: aggiungere queryParams DOPO la firma, per evitare mismatch di endpoint
            // -- gestisco i query Params
            if (options.queryParams) {
                endpoint += `?${options.queryParams}`;
                delete options.queryParams;
            }
            // -- gestisco il corpo della richiesta in base al tipo di contenuto
            switch (type.content_type) {
                case 'json':
                    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
                    options.body = JSON.stringify(options.body); // -- serializzo il corpo in JSON
                    break;
                // ---
                case 'form-data':
                    options.headers['Content-Type'] = options.headers['Content-Type'] || 'multipart/form-data';
                    options.body = this.toFormData(options.body); // -- converto il corpo in FormData
                    break;
                // ---
                case 'bin':
                    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/octet-stream';
                    options.body = options.body; // -- corpo già in formato binario
                    break;
                // ---
                default:
                    // -- tipo di contenuto non gestito
                    console.warn("tipo di contenuto non gestito.");
                    return null;
            }
            // -- eseguo la chiamata fetch all'endpoint con le opzioni fornite
            const response = await fetch(`${Config.origin}${endpoint}`, options);
            // -- controllo se la risposta è valida
            if (!response.ok) {
                const error = {
                    status: response.status,
                    status_text: response.statusText,
                    error: (await response.json()).error
                };
                console.warn(`errore nella fetch:`, error);
                API.recent = error;
                console.error(error); // -- lancio un errore se la risposta non è valida
                return null;
            }
            // -- restituisco il dato in base al tipo di ritorno richiesto
            let result = null;
            switch (type.return_type) {
                case 'text':
                    result = await response.text();
                    break;
                case 'json':
                    result = await response.json();
                    break;
                case 'binario':
                    result = await response.arrayBuffer();
                    break;
                default:
                    // -- tipo di dato non supportato
                    result = null;
                    console.warn("tipo di dato non supportato.");
                    break;
            }
            return result;
        } catch (error) {
            alert(error);
            // -- gestisco eventuali errori nella chiamata
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
}