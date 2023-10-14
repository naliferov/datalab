import {
    createVarSetByPath,
    gatherVarData,
    gatherSubVarsIds,
    prepareForTransfer
} from './varops.js'

let bus;
const _ = Symbol('_');

const getCustomRepoFromPath = (path) => {
    if (
        path[0] && path[0] === 'ctx' &&
        path[1] === 'indexedDB'
    ) {
        return 'indexedDB';
    }
}

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

        let { path, depth } = x;
        if (!depth && depth !== 0) depth = 0;

        const repo = getCustomRepoFromPath(path);
        const set = await createVarSetByPath({
            bus, path, repo,
            isNeedStopIfVarNotFound: true, _,
        });

        if (!set) return;

        const v = set.at(-1);
        if (!v) return;

        return await gatherVarData({ bus, v, depth });
    },
    'var.del': async (x) => {

        const { path } = x;

        const set = await createVarSetByPath({ bus, path, _, isNeedStopIfVarNotFound: true });
        if (!set || set.length < 2) {
            await this.pub('log', { msg: 'Var set not found' });
            return;
        }

        const v1 = set.at(-2);
        const v2 = set.at(-1);

        const subVars = await gatherSubVarsIds({ bus, v: v2 });
        const len = Object.keys(subVars).length;
        if (len > 5) {
            await this.pub('log', { msg: `Try to delete ${ Object.keys(subVars).length } keys at once` });
            return;
        }
        for (let i = 0; i < subVars.length; i++) {
            const id = subVars[i];
            await bus.pub('repo.del', { id });
        }

        await bus.pub('repo.del', { id: v2[_].id });

        delete v1.map[v2[_].name];
        await bus.pub('repo.set', {
            id: v1[_].id,
            v: prepareForTransfer(v1)
        });
    },
    'var.getById': async (x) => {
        const { id } = x;
        return await bus.pub('repo.get', id);
    },
    'var.mv': {},
    'var.connect': {},
    'var.watch': {},

    'var.search': {},
    'var.scan': {},
    'var.gatherSubVars': {},
    'var.getByPath': {},
    'var.createByPath': {},

    'var.addRelation': {},
    'var.delRelation': {},
    'var.findRelations': {},

    'storage.import': {},
    'storage.export': {},
    'storage.countItems': {},

    'server.start': {},
    'server.stop': {},
}

export const varcraft = async x => {
    const { event } = x;

    if (!events[event]) {
        return `Command [${event}] not found`;
    }
    return await events[event](x);
}