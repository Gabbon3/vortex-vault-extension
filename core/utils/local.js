import { AES256GCM } from "../secure/aesgcm.js";
import { Bytes } from "./bytes.js";
import msgpack from "./msgpack.min.js";

export class LocalStorage {
    static prefix = 'vve';
    static key = null;

    static async set(key, value, crypto_key = null) {
        if (crypto_key === 1) crypto_key = this.key;
        const buffer = msgpack.encode(value);
        const data = crypto_key instanceof Uint8Array
            ? await AES256GCM.encrypt(buffer, crypto_key)
            : buffer;
        const base64Data = Bytes.base64.encode(data);

        await chrome.storage.local.set({
            [`${this.prefix}-${key}`]: base64Data
        });
    }

    static async get(key, crypto_key = null) {
        if (crypto_key === 1) crypto_key = this.key;
        try {
            const result = await chrome.storage.local.get(`${this.prefix}-${key}`);
            const base64Data = result[`${this.prefix}-${key}`];
            if (!base64Data) return null;

            const buffer = Bytes.base64.decode(base64Data);
            const value = crypto_key instanceof Uint8Array
                ? await AES256GCM.decrypt(buffer, crypto_key)
                : buffer;

            return msgpack.decode(value);
        } catch (error) {
            console.warn('[!] ChromeStorage - get', error);
            return null;
        }
    }

    static async has(key) {
        const result = await chrome.storage.local.get(`${this.prefix}-${key}`);
        return Object.keys(result).length > 0;
    }

    static async exist(key) {
        return await this.has(key);
    }

    static async remove(key) {
        await chrome.storage.local.remove(`${this.prefix}-${key}`);
    }
}