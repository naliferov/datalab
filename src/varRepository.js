export class VarRepository {
    constructor(varStorage) {
        this.varStorage = varStorage;
    }
    async get(id) {
        return await this.varStorage.get(id);
    }
    async set(id, v) {
        await this.varStorage.set(id, v);
    }
    async del(id) {
        await this.varStorage.del(id);
    }
}