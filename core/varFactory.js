import { Var } from './var.js';

export const createVarFactory = async (ulid, pathRelationFactory, registry) => {

    const serialize = (u) => {
        const data = {}
        if (u.data) data.data = u.data;
        if (u.objects) data.objects = u.objects;
        return data;
    }

    const varFactory = async ({ path, type, dataDefault }) => {

        const pathRelation = pathRelationFactory(path);
        const u = new Var;

        for (const pathPart of pathRelation.toArr()) {

            u.name = pathPart;
            u.id = registry.getIdByName(pathPart);
            if (!u.id) continue;

            const object = await registry.getObjectById(u.id);
            if (object) {
                for (const prop in object) u[prop] = object[prop];
            }
        }

        if (!u.id) u.id = ulid();
        //caching of created object in registry

        if (!u.data && dataDefault) {
            u.data = dataDefault;
            await registry.setObject(u.id, u.name, serialize(u));
        }
        // u.onChange(async () => {
        //   await registry.setObject(serialize(u));
        // });
        //listen data change

        return u;
    };

    return varFactory;
}