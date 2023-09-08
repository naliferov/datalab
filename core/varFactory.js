import { Var } from './var.js';

export const createVarFactory = async (ulid, pathRelationFactory, registry) => {

    const serialize = (u) => {
        const data = {}
        if (u.data) data.data = u.data;
        return data;
    }

    const varFactory = async ({ path, type, dataDefault }) => {

        const pathRelation = pathRelationFactory(path);
        const u = new Var;

        let pathObject;
        let pathArr = pathRelation.toArr();
        for (let i = 0; i < pathArr.length; i++) {
            const pathPart = pathArr[i];

            u.name = pathPart;
            const id = registry.getIdByName(pathPart);
            if (!id) {
                if (i > 0) return; //item not found
                continue;
            }

            const object = await registry.getObjectById(id);
            if (object) {
                for (const prop in object) u[prop] = object[prop];
            }
            pathObject = object;
        }

        //caching of created object in registry
        if (!u.id) u.id = ulid();
        if (!u.data && !dataDefault) {
            u.data = dataDefault;
            await registry.setObject(u.id, u.name, serialize(u));
        } else {
            return;
        }

        u.onUpdate(async () => {
          await registry.setObject(u.id, u.name, serialize(u));
        });
        return u;
    };

    return varFactory;
}