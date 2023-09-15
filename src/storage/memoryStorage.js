export class MemoryStorage {

    constructor(storageObject) {
        this.storage = storageObject;
    }
    async set(id, u) {
        this.storage[id] = u;
    }
    async get(id) {
        return this.storage[id];
    }
    async del(id) {
        delete this.storage[id];
    }
    getStorageObject() {
        return this.storage;
    }
}