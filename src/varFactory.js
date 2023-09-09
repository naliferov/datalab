import { Var } from './var.js';

export class VarFactory {

    constructor(ulid, pathRelationFactory, varRoot, varStorage) {
        this.ulid = ulid;
        this.pathRelationFactory = pathRelationFactory;
        this.varRoot = varRoot;
        this.varStorage = varStorage;
    }

    async getVarByPathRelation(pathRelation) {

        let u = this.varRoot;
        let pathArr = pathRelation.toArr();

        for (let i = 0; i < pathArr.length; i++) {
            const name = pathArr[i];

            u = new Var;
            u.id = u.getVarIdByName(name);
            u.name = name;

            if (!u.id) {
                if (i > 0) return; //item not found
                continue;
            }

            const object = await this.varStorage.get(u.id);
            if (object) {
                for (const prop in object) u[prop] = object[prop];
            } else {
                if (i > 0) return; //item not found
                continue;
            }
        }

        return u;
    }

    async create({ path, type, defaultValue }) {

        const pathRelation = this.pathRelationFactory(path);
        const u = await this.getVarByPathRelation(pathRelation);
        if (!u) return;

        u.sub(async () => {
            //await this.varStorage.set(u.id, u);
        });

        if (!u.id) u.id = this.ulid();
        if (!u.value && defaultValue) {
            u.value = defaultValue;
            //await registry.setVarToRegistry(u.name, u.id);
            //await this.save(u);
        }
        return u;
    }
}