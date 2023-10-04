export class VarRepository {

    constructor(varStorage) {
        this.varStorage = varStorage;
    }

    async getByPath(path) {

        let v1 = await this.getById('root');
        v1.id = 'root';
        let set = [v1];

        if (path[0] === 'root') {
            return set;
        }

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;

            const v = set.at(-1);
            if (!v.map) return;

            const id = v.map[name];
            if (!id) return;

            const v2 = await this.getById(id);
            if (!v2) {
                console.log(`Warning! Item not found by id ${id}`);
                return;
            }
            v2.id = id;
            v2.name = name;

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