export const X = (symbol) => {

    const _ = symbol;
    const f = {};

    return async (x) => {
        if (x[_].x) {
            return await f[x[_].x](x);
        }
        if (x[_].y) f[x[_].y] = x[_].f;
    }
}

export const U = (X, symbol) => {

    const _ = symbol;

    return async (x) => {
        if (x.x) {
            return await X({ [_]: { x: x.x }});
        }
        if (x.y) {
            return await X({ [_]: { y: x.y, f: x.f }});
        }
    }
};

export const b = {
    setX(x) {
        this.x = x;
    },
    set_(_) {
        this._ = _;
    },
    async p(e, data) {
        const _ = this._;
        return await this.x({ [_]: { x: e }, ...data });
    },
    async s(e, f) {
        const _ = this._;
        return await this.x({ [_]: { y: e, f } });
    },
}

export const set = async (x) => {
    const { path, type } = x;
    let data = x.v;
    let repo = x.repo || 'default';
    let { _, b, createPath, prepareForTransfer } = x[x._];

    const set = await createPath({ _, b, repo, path, type });
    if (!set) return;

    for (let i = 0; i < set.length; i++) {
        const v = set[i];
        if (v.v) {
            v.v = data;
            if (!v[_].new) v[_].updated = true;
        }
        if (v[_].new || v[_].updated) {
            await b.p('set', { repo, id: v[_].id, v: prepareForTransfer(v) });
        }
    }

    return set.at(-1);
}

export const get = async (x) => {
    let { path, depth } = x;
    let repo = x.repo || 'default';

    let { b, _, createPath, gatherVarData } = x[x._];

    if (!depth && depth !== 0) depth = 0;

    const set = await createPath({
        _, b, repo, path,
        isNeedStopIfVarNotFound: true,
    });

    if (!set) return;

    const v = set.at(-1);
    if (!v) return;

    return await gatherVarData({ b, _, repo, v, depth });
}

export const del = async (x) => {
    const { path } = x;
    let repo = x.repo || 'default';
    let { b, _, createPath, gatherSubVarsIds, prepareForTransfer } = x[x._];

    const set = await createPath({
        _, b, repo, path,
        isNeedStopIfVarNotFound: true,
    });

    if (!set || set.length < 2) {
        console.log('log', { msg: 'Var set not found' });
        return;
    }

    const v1 = set.at(-2);
    const v2 = set.at(-1);

    const subVars = await gatherSubVarsIds({ b, v: v2 });

    const len = Object.keys(subVars).length;
    if (len > 5) {
        await b.p('log', { msg: `Try to delete ${len} keys at once` });
        return;
    }
    for (let i = 0; i < subVars.length; i++) {
        const id = subVars[i];
        await b.p('del', { id });
    }

    await b.p('del', { id: v2[_].id });

    delete v1.m[v2[_].name];
    await b.p('set', { id: v1[_].id, v: prepareForTransfer(v1) });
}

const mkvar = async (bus, type, _) => {

    const id = await bus.p('getUniqId');
    let v = {
        [_]: { id, new: true }, //[_] is for service data
    };
    v._id = id;

    if (type === 'b') v.b = {};
    else if (type === 'v') v.v = true;
    else if (type === 'm') v.m = {};
    else if (type === 'l') v.l = [];
    else if (type === 'f') v.f = {};
    else if (type === 'x') v.x = {};
    else throw new Error(`Unknown type [${type}]`);

    return v;
}

export const createPath = async (x) => {

    const { b, repo, path, isNeedStopIfVarNotFound, _, } = x;
    let type = x.type || 'v';

    let v1 = await b.p('get', { id: 'root' });
    v1[_] = { id: 'root', name: 'root' };

    let set = [ v1 ];
    if (path[0] === 'root') return set;

    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) return;

        const v1 = set.at(-1);
        let v2;

        if (!v1.m && !v1.l) {
            console.log(`v1 hasn't m or l prop for getting name [${name}]`);
            return;
        }

        let id = v1.m[name];
        if (id) {
            v2 = await b.p('get', { id });
            if (v2) v2[_] = { id };
        }

        if (!v2) {
            if (isNeedStopIfVarNotFound) return;

            const varType = (i === path.length - 1) ? type : 'm';
            v2 = await mkvar(b, varType, _);

            v1.m[name] = v2[_].id;
            if (!v1[_].new) v1[_].updated = true;
        }

        v2[_].name = name;

        set.push(v2);
    }

    return set;
}

//rename to getDeeper
export const gatherVarData = async (x) => {

    const { b, repo, v, depth, _ } = x;

    const data = {
        _id: v[_].id,
        [_]: { id: v[_].id },
    };
    if (v.v) data.v = v.v;

    if (!v.m) return data;

    data.m = {};

    for (let p in v.m) {

        const id = v.m[p];
        if (!id) return;

        if (depth === 0) {
            data.m[p] = id;
            continue;
        }
        const v2 = await b.p('get', { id });
        if (v2) {
            v2._id = id;
            v2[_] = { id };
        }

        if (v2.v) {
            data.m[p] = v2;
        } else if (v2.m) {
            data.m[p] = await gatherVarData({ b, repo, v: v2, depth: depth - 1, _ });
        }
    }
    return data;
}

export const gatherSubVarsIds = async (x) => {

    const { b, v } = x;

    if (!v.m) return {};

    const subVars = [];

    const getSubVars = async (v) => {
        for (let prop in v.m) {
            const id = v.m[prop];
            const subV = await b.p('get', { id });
            subVars.push(id);

            if (subV.m) await getSubVars(subV);
        }
    }
    await getSubVars(v);

    return subVars;
}

export const prepareForTransfer = (v) => {
    const d = {};

    if (v.b) d.b = v.b;
    if (v.v) d.v = v.v;
    if (v.m) d.m = v.m;
    if (v.l) d.l = v.l;
    if (v.f) d.f = v.f;
    if (v.x) d.x = v.x;

    return d;
}


export const toRight = (o, targetO) => {
    const { x, y, width } = targetO.getSize();
    o.absolute();
    o.setPosition(x + width + 10, y);
}

//const varRepository = new Repository(new NetStorage(bus));
//separate style from pure logic

export const mkOb = (x) => {
    //todo opObject //dataObj // tick, add, subtract
    //o, msg, num, list, symbol, comment
    const data = {
        txt: x.txt,
        event: {
            //can attach any custom handler with specific connection mechanics build in UI.
            //click: () => {}
        },
    }
    if (x.style) data.style = x.style;

    return data;
}

//tick, add, subtract, move and etc.
export const mkOp = {
    txt: '+',
    style: {
        display: 'inline-block',
        cursor: 'pointer',
        'fontWeight': 'bold',
        margin: '1em'
    },
    // event: {
    //     click: async (e) => {
    //         const o = createOb();
    //         await op({ event: 'o.add', o: o });
    //     }
    // }
};

const on = (id, eventName, callback) => {
    //add event to id!
    //dom.addEventListener(eventName, callback);
}

const m = () => {

}
export const dmk = (d, x) => {
    const { id, type, txt } = x;

    const o = d.createElement(type || 'div');
    if (txt) o.innerText = txt;

    const classD = x['class'];
    if (classD) {
        o.className = Array.isArray(classD) ? classD.join(' ') : classD;
    }
    return o;
}
const dragAndDrop = () => {

}

// const setAtr (d, k, v) => {
//
// }

export const parseCliArgs = cliArgs => {
    const args = {};
    let num = 0;

    for (let i = 0; i < cliArgs.length; i++) {
        if (i < 2) continue; //skip node and scriptName args

        let arg = cliArgs[i];
        args[num++] = arg;

        if (arg.includes('=')) {
            let [k, v] = arg.split('=');
            if (!v) {
                args[num] = arg; //start write args from main 0
                continue;
            }
            args[k.trim()] = v.trim();
        } else {
            args['cmd'] = arg;
        }
    }
    return args;
};

export const pathToArr = path => Array.isArray(path) ? path : path.split('.');