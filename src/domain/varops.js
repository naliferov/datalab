const mkvar = async (bus, type, _) => {

    const id = await bus.pub('getUniqId');
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

export const createVarSetByPath = async (x) => {

    const { bus, repo, path, isNeedStopIfVarNotFound, _, } = x;
    let type = x.type || 'v';

    let v1 = await bus.pub(`${repo}.get`, { id: 'root' });
    v1[_] = { id: 'root', name: 'root' };

    let set = [ v1 ];
    if (path[0] === 'root') return set;

    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) return;

        const v1 = set.at(-1);
        let v2;

        let id = v1.m[name];
        if (id) {
            v2 = await bus.pub(`${repo}.get`, { id });
            if (v2) v2[_] = { id };
        }

        if (!v2) {
            if (isNeedStopIfVarNotFound) return;

            const varType = (i === path.length - 1) ? type : 'm';
            v2 = await mkvar(bus, varType, _);

            v1.m[name] = v2[_].id;
            if (!v1[_].new) v1[_].updated = true;
        }
        v2[_].name = name;

        set.push(v2);
    }

    return set;
}

export const gatherVarData = async (x) => {

    const { bus, repo, v, depth, _ } = x;

    const data = {
        _id: v[_].id,
        [_]: { id: v[_].id },
    };
    if (v.v) data.v = v.v;

    if (!v.m) return data;

    data.m = {};

    //todo make function for gatherMapData;
    for (let p in v.m) {

        const id = v.m[p];
        if (!id) return;

        if (depth === 0) {
            data.m[p] = id;
            continue;
        }
        const v2 = await bus.p(`${repo}.get`, { id });
        if (v2) {
            v2._id = id;
            v2[_] = { id };
        }

        if (v2.v) {
            data.m[p] = v2;
        } else if (v2.m) {
            data.m[p] = await gatherVarData({ bus, repo, v: v2, depth: depth - 1, _ });
        }
    }
    return data;
}

export const gatherSubVarsIds = async (x) => {

    const { bus, repo, v } = x;

    if (!v.m) return {};

    const subVars = [];

    const getSubVars = async (v) => {
        for (let prop in v.m) {
            const id = v.m[prop];
            const subV = await bus.pub(`${repo}.get`, { id });
            subVars.push(id);

            if (subV.m) await getSubVars(subV);
        }
    }
    await getSubVars(v);

    return subVars;
}

export const prepareForTransfer = (v) => {
    const d = {};

    if (v.v) d.v = v.v;
    if (v.m) d.m = v.m;
    if (v.l) d.l = v.l;
    if (v.f) d.f = v.f;
    if (v.x) d.x = v.x;

    return d;
}