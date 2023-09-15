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
        if (pathArr[0] === 'root') return this.varRoot;

        let u;
        let notFoundCount = 0;

        for (let i = 0; i < pathArr.length; i++) {
            const name = pathArr[i];
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

    async create({ path }) {
        const pathRelation = this.pathRelationFactory(path);

        const u = await this.getVarByPathRelation(pathRelation);
        u.parentVar = pathRelation.toArr().at(-1);
        if (!u) return;
        if (!u.id) u.id = this.ulid();

        //if (!p || !name) return;

        // p.sub(async () => await this.varStorage.set(p.id, p));
        // u.sub(async () => {
        //     await this.varStorage.set(u.id, u);
        //     if (!p.get(name)) {
        //         p.set(name, u.id);
        //     }
        // });
        return u;
    }

    async delete(v, name) {
        const p = v.parent;
        if (!p || !name) return;
        p.del(name);
        await this.varStorage.del(v.id);
    }
}