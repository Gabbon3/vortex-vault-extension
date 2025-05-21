import { Bytes } from "./bytes.js";
import msgpack from "./msgpack.min.js";

export class SessionStorage {
    static prefix = 'vve';
    static memory = new Map();

    static set(key, value) {
        const buffer = msgpack.encode(value);
        const encoded = Bytes.base64.encode(buffer);
        this.memory.set(`${this.prefix}-${key}`, encoded);
    }

    static get(key) {
        try {
            const encoded = this.memory.get(`${this.prefix}-${key}`);
            return encoded ? msgpack.decode(Bytes.base64.decode(encoded)) : null;
        } catch (error) {
            console.warn('[!] RAMStorage - get', error);
            return null;
        }
    }

    static remove(key) {
        this.memory.delete(`${this.prefix}-${key}`);
    }

    static has(key) {
        return this.memory.has(`${this.prefix}-${key}`);
    }

    static clear() {
        this.memory.clear();
    }
}