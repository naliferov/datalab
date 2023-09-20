
export class VarRepository {

    constructor(ulid, varRoot, varStorage) {
        this.ulid = ulid;
        this.varRoot = varRoot;
        this.varStorage = varStorage;
    }

    async getVarByPath(path) {
        let lastVar = this.varRoot;
        if (path[0] === 'root') return this.varRoot;

        let u;
        let notFoundCount = 0;


        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;

            u = new Var;
            u.id = lastVar.get(name);
            u.parentId = lastVar.id;

            if (!u.id) {
                if (++notFoundCount > 1) return;
                continue;
            }

            const data = await this.varStorage.get(u.id);
            if (data) {
                for (const prop in data) u[prop] = data[prop];
            } else {
                if (i > 0) return;
                continue;
            }
            lastVar = u;
        }

        return u;
    }

    async get(path) {
        const u = await this.getVarByPath(path);
        if (!u) return;

        u.relativeVarName = path.at(-1);
        if (!u.id) u.id = this.ulid();

        return u;
    }
}