import { Bytes } from "../utils/bytes.js";
import { Cripto } from "../secure/cripto.js";
import { AES256GCM } from "../secure/aesgcm.js";
import { SessionStorage } from "../utils/session.js";
import msgpack from "../utils/msgpack.min.js";
import { API } from "../utils/api.js";
import { LocalStorage } from "../utils/local.js";
import { VaultLocal } from "./vault.local.js";

export class VaultService {
    // POPUP VAR
    static info = null;
    // -----
    static KEK = null;
    static salt = null;
    static vaults = [];
    // Tempo da rimuovere da Date.now() per ottenere i vault piu recenti
    static getDateDiff = 30 * 60 * 1000;
    /**
     * 
     */
    static async init(full = false) {
        // POPUP VAR
        this.info = document.querySelector('#signin-info');
        // -----
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
        this.KEK = await LocalStorage.get('master-key', ckeKeyAdvanced);
        this.salt = await LocalStorage.get('salt', ckeKeyAdvanced);
        return this.KEK && this.salt ? true : false;
    }
    /**
     * Sincronizza e inizializza il Vault con il db
     * @param {boolean} full - sincronizzazione completa true, false sincronizza solo il necessario
     * @returns {boolean} true per processo completato con successo
     */
    static async syncronize(full = false) {
        const configured = await this.configSecrets();
        if (!configured || !this.KEK)
            return Log.summon(2, "Any Crypto Key founded");
        const vault_update = (await LocalStorage.get("vault-update")) ?? null;
        let selectFrom = null;
        /**
         * non mi allineo esattamente alla data di ultima sincronizzazione dal db
         * in questo modo evito di farmi restituire dati incompleti per
         * disincronizzazione tra client e server
         */
        if (vault_update) selectFrom = new Date(Date.now() - this.getDateDiff);
        /**
         * Provo ad ottenere i vault dal localstorage
         */
        this.vaults = await VaultLocal.get(this.KEK);
        if (this.vaults.length === 0) {
            console.log("[i] Sincronizzo completamente con il vault");
            full = true;
        }
        /**
         * VaultLocal.get restituisce [] anche nel caso in cui ce stato un errore crittografico
         * in ogni caso se è vuoto effettuo una sincronizzazione completa con il server
         */
        try {
            const vaults_from_db = await this.get(full ? null : selectFrom);
            if (vaults_from_db.length > 0) {
                if (full) {
                    await VaultLocal.save(
                        vaults_from_db.filter((vault) => {
                            return vault.deleted == false;
                        }),
                        this.KEK
                    );
                    this.vaults = vaults_from_db;
                } else {
                    this.vaults = await VaultLocal.sync_update(
                        vaults_from_db,
                        this.KEK
                    );
                }
            } else {
                // -- se eseguendo il sync totale non ci sono vault nel db allora azzero per sicurezza anche in locale
                if (full) await VaultLocal.save([], this.KEK);
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
        // ---
        const res = await API.fetch('/vaults', {
            method: 'GET',
            queryParams: updated_after ? `updated_after=${updated_after.toISOString()}` : null,
        });
        if (!res) return null;
        // ---
        if (res.length > 0) LocalStorage.set('vault-update', new Date());
        // ---
        return await this.decryptAllVaults(res) ? res : null;
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
     * @param {Uint8Array} providedDEK
     * @returns {{ DEK: Uint8Array, VLT: Uint8Array }}
     */
    static async encrypt(vault, providedDEK = null, KEK = this.KEK) {
        // -- genero una dek specifica per l'elemento
        const DEK = providedDEK || Cripto.randomBytes(32);
        const encryptedDEK = await AES256GCM.encrypt(DEK, KEK);
        // -- cifro il vault
        const encodedVault = msgpack.encode(vault);
        const encryptedVault = await AES256GCM.encrypt(encodedVault, DEK);
        // -- unisco il salt al vault cifrato
        return {
            DEK: msgpack.encode({
                // DEK Data Encryption Key: le info sulla chiave e la chiave cifrata
                kek: 1, // Key Encryption Key version
                algo: "aesgcm",
                dek: encryptedDEK,
            }),
            VLT: encryptedVault, // VLT = Vault
        };
    }
    /**
     * Decifra un vault
     * @param {Uint8Array} encrypted
     * @param {Uint8Array} DEKEncoded
     * @return {{ DEK: Uint8Array, VLT: Object }} - il vault decifrato insieme alla DEK cifrata
     */
    static async decrypt(encryptedVault, DEKEncoded, KEK = this.KEK) {
        const decodedDEK = msgpack.decode(DEKEncoded);
        // -- per il momento commentate perche non servono
        // const algo = decodedEnvelope.DEK.algo;
        // const kekVersion = decodedEnvelope.DEK.kek;
        // -- decifro la DEK con la KEK
        const DEK = await AES256GCM.decrypt(decodedDEK.dek, KEK);
        // -- decifro i dati
        const decryptedVault = await AES256GCM.decrypt(encryptedVault, DEK);
        // ---
        return {
            DEK: DEKEncoded,
            VLT: msgpack.decode(decryptedVault)
        };
    }
    /**
     * Compatta i vaults per renderli pronti all esportazione
     * @returns {Array<Object>} l'array dei vault compattati
     */
    static compactVaults(vaults = this.vaults) {
        return vaults.map((vault) => {
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
    static decompactVaults(compacted_vaults) {
        return compacted_vaults.map((vault) => {
            // non tengo conto dell'uuid, poiche posso tranquillamente ricrearlo
            // const { I: id, S: secrets, C: createdAt, U: updatedAt } = vault;
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
                // -- decripto i secrets
                const VLTBytes = new Uint8Array(vaults[i].secrets.data);
                const DEKBytes = new Uint8Array(vaults[i].dek.data);
                const { DEK, VLT } = await this.decrypt(VLTBytes, DEKBytes);
                // --
                vaults[i].secrets = VLT;
                vaults[i].dek = DEK;
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