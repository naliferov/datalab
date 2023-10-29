import {
    createVarSetByPath,
    gatherVarData,
    gatherSubVarsIds,
    prepareForTransfer
} from './varops.js';

const types = new Set(['b', 'v', 'm', 'l', 'f', 'x']);

let _;
let bus;

const events = {
    '_.set': (x) => _ = x._,
    'bus.set': (x) => bus = x.bus,
    'var.set': async (x) => {

        console.log(x);

        const { id, path, data, type } = x;
        let repo = x.repo || 'default';

        const set = await createVarSetByPath({ bus, repo, path, type, _, });
        if (!set) return;

        for (let i = 0; i < set.length; i++) {
            const v = set[i];
            if (v.v) {
                v.v = data;
                if (!v[_].new) v[_].updated = true;
            }
            if (v[_].new || v[_].updated) {
                await bus.pub(`${repo}.set`, {
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
        let repo = x.repo || 'default';

        const set = await createVarSetByPath({
            bus, repo, path, _,
            isNeedStopIfVarNotFound: true,
        });
        if (!set) return;

        const v = set.at(-1);
        if (!v) return;

        return await gatherVarData({ bus, repo, v, depth, _ });
    },
    'var.del': async (x) => {

        const { id, path } = x;
        let repo = x.repo || 'default';

        const set = await createVarSetByPath({
            bus, repo, path, _,
            isNeedStopIfVarNotFound: true,
        });
        if (!set || set.length < 2) {
            await this.pub('log', { msg: 'Var set not found' });
            return;
        }

        const v1 = set.at(-2);
        const v2 = set.at(-1);

        const subVars = await gatherSubVarsIds({ bus, v: v2 });
        const len = Object.keys(subVars).length;
        if (len > 5) {
            await bus.pub('log', { msg: `Try to delete ${ Object.keys(subVars).length } keys at once` });
            return;
        }
        for (let i = 0; i < subVars.length; i++) {
            const id = subVars[i];
            await bus.pub(`${repo}.del`, { id });
        }

        await bus.pub(`${repo}.del`, { id: v2[_].id });

        delete v1.m[v2[_].name];
        await bus.pub(`${repo}.set`, {
            id: v1[_].id,
            v: prepareForTransfer(v1)
        });
    },
    'var.getById': async (x) => {
        const { id } = x;
        const repo = x.repo || 'repo';
        return await bus.pub(`${repo}.get`, { id });
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