export class VarRepository {

    constructor(varStorage) {
        this.varStorage = varStorage;
    }

    async getByPath(path) {

        let relation = [ await this.getById('root') ];
        let last = relation.at(-1);

        console.log(last);
        return;

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;
            if (!varA.assoc) return;

            const id = varA.assoc[name];
            if (!id) return;
            varB = await this.getById(id);
            if (!varB) return;
            varB.id = id;
            varB.name = name;

            if (i !== path.length - 1) {
                varA = varB;
            }
        }

        return { varA, varB };
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