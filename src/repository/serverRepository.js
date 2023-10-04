export class ServerRepository {

    constructor(varStorage) {
        this.varStorage = varStorage;
    }

    async getByPath(path) {
        return this.varStorage.getByPath(path);
    }
}