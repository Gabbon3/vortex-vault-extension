import { Bytes } from "../utils/bytes.js";
import { Cripto } from "../secure/cripto.js";
import { AES256GCM } from "../secure/aesgcm.js";
import { SessionStorage } from "../utils/session.js";
import msgpack from "../utils/msgpack.min.js";
import { API } from "../utils/api.js";
import { LocalStorage } from "../utils/local.js";
import { VaultLocal } from "./vault.local.js";

export class VaultService {
    static master_key = null;
    static salt = null;
    static vaults = [];
    // Tempo da rimuovere da Date.now() per ottenere i vault piu recenti
    static getDateDiff = 30 * 60 * 1000;
    /**
     * 
     */
    static async init(full = false) {
        // ---
        const configured = await VaultService.configSecrets();
        // -- se non ci sono provo ad avviare la sessione
        if (!configured) return false;
        // -- se ci sono avvio il vault
        const initialized = await VaultService.syncronize(full);
        if (initialized) {
            console.log('Vault initialized');
            // -- invio i vaults
            await chrome.storage.session.set({ vaults: VaultService.vaults });
            // ---
            return true;
        }
        return initialized;
    }
    /**
     * Configura i segreti necessari ad utilizzare il vault
     * @returns {boolean} - true se entrambi sono presenti
     */
    static async configSecrets() {
        // -- ottengo la scadenza dell'access token
        const ckeKeyAdvanced = SessionStorage.get('cke-key-basic');
        // - se scaduto restituisco false cosi verrà rigenerata la sessione
        if (ckeKeyAdvanced === null) return false;
        this.master_key = await LocalStorage.get('master-key', ckeKeyAdvanced);
        this.salt = await LocalStorage.get('salt', ckeKeyAdvanced);
        return this.master_key && this.salt ? true : false;
    }
    /**
     * Sincronizza e inizializza il Vault con il db
     * @param {boolean} full - sincronizzazione completa true, false sincronizza solo il necessario
     * @returns {boolean} true per processo completato con successo
     */
    static async syncronize(full = false) {
        const configured = await this.configSecrets();
        if (!configured || !this.master_key) return alert('Any Crypto Key founded');
        const vault_update = await LocalStorage.get('vault-update') ?? null;
        let selectFrom = null;
        /**
         * non mi allineo esattamente alla data di ultima sincronizzazione dal db
         * in questo modo evito di farmi restituire dati incompleti per
         * disincronizzazione tra client e server
         */
        if (vault_update) selectFrom = new Date(Date.now() - (this.getDateDiff));
        /**
         * Provo ad ottenere i vault dal localstorage
         */
        this.vaults = [];
        try {
            this.vaults = await VaultLocal.get(this.master_key);
        } catch (error) {
            console.log('[X] Errore crittografico localstorage', error);
            console.log('[i] Sincronizzo completamente con il vault');
            full = true;
        }
        /**
         * Se ce stato un errore nell'ottenerli dal localstorage, effettuo una sincronizzazione completa
         */
        try {
            /**
             * se non è richiesta la sincronizzazione completa
             * effettuo una sincronizzazione completa se qualcosa è stato eliminato
             */
            if (!full) {
                const n_local_vaults = this.vaults.length;
                const n_db_vaults = await this.count();
                // recupero tutti i vault se per esempio un vault è stato eliminato sul db
                if (n_local_vaults > n_db_vaults) full = true;
            }
            // ---
            const vaults_from_db = await this.get(full ? null : selectFrom);
            if (vaults_from_db.length > 0) {
                if (full) {
                    await VaultLocal.save(vaults_from_db, this.master_key);
                    this.vaults = vaults_from_db;
                } else {
                    this.vaults = await VaultLocal.sync_update(vaults_from_db, this.master_key)
                }
            } else {
                // -- se eseguendo il sync totale non ci sono vault nel db allora azzero per sicurezza anche in locale
                if (full) await VaultLocal.save([], this.master_key);
            }
        } catch (error) {
            console.warn('Sync Error - Vault => ', error);
            LocalStorage.remove('vault-update');
            LocalStorage.remove('vaults');
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
        let url = '/vaults';
        if (updated_after) url += `?updated_after=${updated_after.toISOString()}`;
        // ---
        const res = await API.fetch(url, {
            method: 'GET',
        });
        if (!res) return null;
        // ---
        if (res.length > 0) LocalStorage.set('vault-update', new Date());
        // ---
        return await this.decrypt_vaults(res) ? res : null;
    }
    /**
     * Restituisce il numero totale di vault del db
     * @returns {number}
     */
    static async count() {
        const res = await API.fetch('/vaults/count', {
            method: 'GET',
        });
        if (!res) return 0;
        return res.count;
    }
    /**
     * Restituisce un vault tramite id
     * @param {string} vault_id 
     * @returns {Object}
     */
    static get_vault(vault_id) {
        return this.vaults[this.get_index(vault_id)];
    }
    /**
     * Restituisce l'index di un vault
     * @param {Array<Object>} vaults 
     * @param {string} vault_id 
     * @returns {string}
     */
    static get_index(vault_id, vaults = this.vaults) {
        return vaults.findIndex(vault => vault.id === vault_id);
    }
    /**
     * Cifra un vault
     * @param {Object} vault 
     * @param {Uint8Array} provided_salt 
     * @returns {Uint8Array}
     */
    static async encrypt(vault, provided_salt = null, master_key = this.master_key) {
        // -- derivo la chiave specifica del vault
        const salt = provided_salt || Cripto.random_bytes(16);
        const key = await Cripto.hmac(salt, master_key);
        // -- cifro il vault
        const vault_bytes = msgpack.encode(vault);
        const encrypted_vault = await AES256GCM.encrypt(vault_bytes, key);
        // -- unisco il salt al vault cifrato
        return Bytes.merge([salt, encrypted_vault], 8);
    }
    /**
     * Decifra un vault
     * @param {Uint8Array} encrypted_bytes 
     * @return {Object} - il vault decifrato
     */
    static async decrypt(encrypted_bytes, master_key = this.master_key) {
        // -- ottengo il salt e i dati cifrati
        const salt = encrypted_bytes.subarray(0, 16);
        const encrypted_vault = encrypted_bytes.subarray(16);
        // -- derivo la chiave specifica del vault
        const key = await Cripto.hmac(salt, master_key);
        // -- decifro i dati
        const decrypted_vault = await AES256GCM.decrypt(encrypted_vault, key);
        // -- decodifico i dati
        return msgpack.decode(decrypted_vault);
    }
    /**
     * Compatta i vaults per renderli pronti all esportazione
     * @returns {Array<Object>} l'array dei vault compattati
     */
    static compact_vaults(vaults = this.vaults) {
        return vaults.map(vault => {
            // non tengo conto dell'uuid, poiche posso tranquillamente ricrearlo
            // const { id: I, secrets: S, createdAt: C, updatedAt: U } = vault;
            const { secrets: S, createdAt: C, updatedAt: U } = vault;
            return { S, C, U };
        });
    }
    /**
     * Decompatta i vaults per renderli nuovamente utilizzabili
     * @param {Array<Object>} compacted_vaults 
     */
    static decompact_vaults(compacted_vaults) {
        return compacted_vaults.map(vault => {
            // non tengo conto dell'uuid, poiche posso tranquillamente ricrearlo
            // const { I: id, S: secrets, C: createdAt, U: updatedAt } = vault;
            const { S: secrets, C: createdAt, U: updatedAt } = vault;
            return { secrets, createdAt, updatedAt };
        });
    }
    /**
     * Cifra tutti i vault 
     * @param {Array<Object>} vaults - array dei vari vault
     */
    static async encrypt_vaults(vaults) {
        let i = 0;
        try {
            for (i = 0; i < vaults.length; i++) {
                // -- decripto i secrets
                const encrypted_bytes = await this.encrypt(vaults[i]);
                // ---
                vaults[i].secrets = encrypted_bytes;
            }
        } catch (error) {
            console.warn(`Decrypt Vault error at i = ${i}:`, error);
            return false;
        }
        return true;
    }
    /**
     * Decifra tutti i vault 
     * @param {Array<Object>} vaults - array dei vari vault
     */
    static async decrypt_vaults(vaults) {
        if (vaults instanceof Array === false || vaults.length === 0) return true;
        let i = 0;
        try {
            for (i = 0; i < vaults.length; i++) {
                // -- decripto i secrets
                const encrypted_bytes = new Uint8Array(vaults[i].secrets.data);
                const data = await this.decrypt(encrypted_bytes);
                // --
                vaults[i].secrets = data;
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
}

window.VaultService = VaultService;