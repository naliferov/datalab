import {
    createVarSetByPath,
    gatherVarDataByDepth,
    prepareForTransfer
} from './varFunctions.js'

let bus;

const c = {
    'bus.set': (x) => {
      bus = x.bus;
      return { msg: 'Bus is set.' }
    },
    'var.set': async (x) => {

        const { path, data } = x;

        const set = await createVarSetByPath({ bus, path });
        if (!set) return;

        for (let i = 0; i < set.length; i++) {
            const v = set[i];

            if (v.data) {
                v.data = data;
                if (!v.new) v.updated = true;
            }
            if (v.new || v.updated) {
                await bus.pub('repo.set', {
                    id: v.id,
                    v: prepareForTransfer(v)
                });
            }
        }

        return { var: prepareForTransfer(set.at(-1)) }
    },
    'var.get': async (x) => {

        const { path, depth } = x;

        const set = await createVarSetByPath({ bus, path, isNeedStopIfVarNotFound: true });
        if (!set) return;

        const v = set.at(-1);
        if (!v) return;
        if (v.data) return v;

        return await gatherVarDataByDepth({ bus, v, depth });
    },
    'var.del': async (path) => {
        //const set = await repo.getByPath(path);

        return;

        if (!set || !set.length) {
            console.log(path, 'Var set not found')
            return;
        }
        //const vars = await cmd['var.gatherSubVars'](repo, set.at(0)); console.log(Object.keys(vars).length); return;
        const varA = set.at(-2);
        const varB = set.at(-1);

        const subVars = await cmd['var.gatherSubVars'](repo, varB);
        const len = Object.keys(subVars).length;
        if (len > 5) {
            console.log(`Try to delete ${Object.keys(subVars).length} keys at once`);
            return;
        }
        for (let id in subVars) {
            console.log(`Delete subVar [${id}]`);
            await repo.del(id);
        }

        console.log(`Delete var [${varB.id}]`);
        await repo.del(varB.id);
        delete varA.map[varB.name];

        console.log(`Update var [${varA.id}]`);
        await repo.set(varA.id, serializer.serialize(varA));
    },
    'var.gatherSubVars': async (repo, v) => {
        if (!v.map) return {};

        const subVars = {};

        const getSubVars = async (v) => {
            for (let prop in v.map) {
                const id = v.map[prop];
                const subV = await repo.get(id);
                subVars[id] = 1;

                if (subV.map) await getSubVars(subV);
            }
        }
        await getSubVars(v);

        return subVars;
    },
    'server.start': (meta) => {

        const { fs, server, port, rqHandler, repo } = meta;

        meta.serveFS = true;
        meta.cmdMap = {
            'default': async () => {
                return {
                    msg: await fs.readFile('./src/ui/index.html', 'utf8'),
                    type: 'text/html',
                }
            },
            'var.get': async ({msg}) => {
                let { path, depth } = msg;
                depth = Number(depth) || 0;

                return await cmd['var.get'](repo, path, depth);
            }
        }
        server.on('request', async (rq, rs) => {
            await rqHandler(meta, rq, rs);
        });
        server.listen(port, () => console.log(`Server start on port: [${port}].`));
    },
    'server.stop': () => {},

    'transaction.set': async (meta, op) => {

        const { trans, repo } = meta;

        if (state.lock) return;
        state.lock = true;

        state.version++;
        state.transaction.push(transaction);

        await repo.set('transaction', {
            version: state.version,
            transaction: state.transaction
        });

        state.lock = false;
    },
    'transaction.get': (repo, version) => {
        //if first transaction version is behind query version, client have to download all data
        //how to download all data without corruption
        //return products after this version
    }
}

export const varcraft = async x => {
    const { cmd } = x;

    if (!c[cmd]) {
        return 'Command not found';
    }
    return await c[cmd](x);
}