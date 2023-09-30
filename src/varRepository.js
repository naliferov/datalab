export class VarRepository {

    constructor(varStorage) {
        this.varStorage = varStorage;
    }

    async getByPath(path) {

        let set = [ await this.getById('root') ];

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;

            const v = set.at(-1);
            if (!v.assoc) return;

            const id = v.assoc[name];
            if (!id) return;

            const v2 = await this.getById(id);
            if (!v2) return;
            // v2.__verbose = {
            //     id,
            //     pathName: name
            // }

            set.push(v2);
        }

        return set;
    }

    async getById(id) {
        return await this.varStorage.get(id);
    }
    async set(id, v) {
        await this.varStorage.set(id, v);
    }
    async del(id) {
        await this.varStorage.del(id);
    }
}