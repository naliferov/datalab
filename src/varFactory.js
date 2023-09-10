import { Var } from './var.js';

export class VarFactory {

    constructor(ulid, pathRelationFactory, varRoot, varStorage) {
        this.ulid = ulid;
        this.pathRelationFactory = pathRelationFactory;
        this.varRoot = varRoot;
        this.varStorage = varStorage;
    }

    async getVarByPathRelation(pathRelation) {

        let lastVar = this.varRoot;
        let pathArr = pathRelation.toArr();
        if (pathArr[0] === 'root') {
            return this.varRoot;
        }

        let u = new Var;

        for (let i = 0; i < pathArr.length; i++) {
            const name = pathArr[i];

            u.id = lastVar.get(name);
            u.name = name;
            u.parent = lastVar;

            if (!u.id) {
                if (i > 0) return;
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

    async create({ path }) {

        const pathRelation = this.pathRelationFactory(path);
        const u = await this.getVarByPathRelation(pathRelation);
        if (!u) return;
        if (!u.id) u.id = this.ulid();

        u.sub(async () => {
            const p = u.parent;
            if (!p) return;

            await this.varStorage.set(u.id, u);
            if (!p.get(u.name)) {
                p.set(u.name, u.id);
            }
        });
        return u;
    }

    async save(u) {
        await this.varStorage.set(u.id, u);
    }
}