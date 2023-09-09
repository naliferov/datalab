import { Var } from './var.js';

export const createVarFactory = async (ulid, pathRelationFactory, registry) => {

    const serialize = (u) => {
        const o = {}
        if (u.value) o.value = u.value;
        if (u.vars) o.vars = u.vars;
        return o;
    }

    const getVarByPathRelation = async (pathRelation) => {

        let u;
        let pathArr = pathRelation.toArr();

        for (let i = 0; i < pathArr.length; i++) {
            const name = pathArr[i];

            let id;
            if (u) {
                id = u.getVarIdByName(name);
            } else {
                id = registry.getVarIdByName(name);
                u = new Var;
            }
            u.name = name;

            if (id) {
                u.id = id;
            } else {
                if (i > 0) return; //item not found
                continue;
            }

            const object = await registry.getObjectById(id);
            if (object) {
                for (const prop in object) u[prop] = object[prop];
            } else {
                if (i > 0) return; //item not found
                continue;
            }
        }

        return u;
    }

    const varFactory = async ({ path, type, defaultValue }) => {

        const pathRelation = pathRelationFactory(path);
        const u = await getVarByPathRelation(pathRelation);
        if (!u) return;

        u.onUpdate(async () => {
            await registry.setObject(u.id, u.name, serialize(u));
        });

        if (!u.id) u.id = ulid();
        if (!u.value && defaultValue) {
            u.value = defaultValue;
            await registry.setObject(u.id, u.name, serialize(u));
        }
        return u;
    };

    return varFactory;
}