import {
    createVarSetByPath,
    gatherVarData,
    gatherSubVarsIds,
    prepareForTransfer
} from './varFunctions.js'

let bus;
const _ = Symbol('_');

const events = {
    'bus.set': (x) => bus = x.bus,
    'var.set': async (x) => {

        const { path, data } = x;

        const set = await createVarSetByPath({ bus, path, _, });
        if (!set) return;

        for (let i = 0; i < set.length; i++) {
            const v = set[i];

            if (v.data) {
                v.v = data;
                if (!v[_].new) v[_].updated = true;
            }
            if (v.v) {
                delete v.data;
                v.v = data;
                if (!v[_].new) v[_].updated = true;
            }

            if (v[_].new || v[_].updated) {
                await bus.pub('repo.set', {
                    id: v[_].id,
                    v: prepareForTransfer(v)
                });
            }
        }

        return set.at(-1);
    },
    'var.get': async (x) => {

        const { path, depth } = x;

        const set = await createVarSetByPath({ bus, path,  _, isNeedStopIfVarNotFound: true });
        if (!set) return;

        const v = set.at(-1);
        if (!v) return;

        return await gatherVarData({ bus, v, depth });
    },
    'var.del': async (x) => {

        const { path } = x;

        const set = await createVarSetByPath({ bus, path, _, isNeedStopIfVarNotFound: true });
        if (!set || set.length < 2) {
            console.log(path, 'Var set not found')
            return;
        }

        const v1 = set.at(-2);
        const v2 = set.at(-1);

        const subVars = await gatherSubVarsIds({ bus, v: v2 });
        const len = Object.keys(subVars).length;
        if (len > 5) {
            console.log(`Try to delete ${ Object.keys(subVars).length } keys at once`);
            return;
        }
        for (let i = 0; i < subVars.length; i++) {
            const id = subVars[i];
            await bus.pub('repo.del', { id });
        }

        await bus.pub('repo.del', { id: v2[_].id });

        delete v1.map[v2[_].name];
        console.log(`update`, v1);
        await bus.pub('repo.set', {
            id: v1[_].id,
            v: prepareForTransfer(v1)
        });
    },
}

export const varcraft = async x => {
    const { event } = x;

    if (!events[event]) {
        return `Command [${event}] not found`;
    }
    return await events[event](x);
}