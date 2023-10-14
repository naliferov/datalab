const mkVar = async (bus, type, _) => {

    const id = await bus.pub('getUniqId');
    let v = {
        [_]: { id, new: true },
    };
    v.id = id;

    if (type === 'val') {
        v.v = true;
    } else {
        v.map = {};
    }
    return v;
}

export const createVarSetByPath = async (x) => {

    const { bus, path, isNeedStopIfVarNotFound, _ } = x;
    const repo = x.repo || 'repo';

    let v1 = await bus.pub(`${repo}.get`, { id: 'root' });
    v1[_] = { id: 'root', name: 'root' };

    let set = [ v1 ];
    if (path[0] === 'root') return set;

    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) return;

        //todo if name ending is [] so work with list
        const v1 = set.at(-1);
        let v2;

        let id = v1.map[name];
        if (id) {
            v2 = await bus.pub(`${repo}.get`, { id });
            if (v2) v2[_] = { id };
        }

        if (!v2) {
            if (isNeedStopIfVarNotFound) return;

            v2 = await mkVar(bus, (i === path.length - 1) ? 'val' : 'map', _);

            v1.map[name] = v2[_].id;
            if (!v1[_].new) v1[_].updated = true;
        }
        v2[_].name = name;

        set.push(v2);
    }

    return set;
}

export const gatherVarData = async (x) => {

    const { bus, v, depth, _ } = x;

    const data = { _id: v[_].id };
    if (v.v) data.v = v.v;

    if (!v.map) return data;

    data.map = {};

    for (let prop in v.map) {

        const id = v.map[prop];
        if (!id) return;

        if (depth === 0) {
            data.map[prop] = id;
            continue;
        }

        const v2 = await bus.pub('repo.get', { id });
        if (v2) {
            v2[_] = { id }; v2._id = id;
        }

        if (v2.map) {
            data.map[prop] = await gatherVarData({ bus, v: v2, depth: depth - 1, _ });
        } else if (v2.data) {
            data.map[prop] = v2;
        } else if (v2.v) {
            data.map[prop] = v2;
        }
    }
    return data;
}

export const gatherSubVarsIds = async (x) => {

    const { bus, v } = x;

    if (!v.map) return {};

    const subVars = [];

    const getSubVars = async (v) => {
        for (let prop in v.map) {
            const id = v.map[prop];
            const subV = await bus.pub('repo.get', { id });
            subVars.push(id);

            if (subV.map) await getSubVars(subV);
        }
    }
    await getSubVars(v);

    return subVars;
}

export const prepareForTransfer = (v) => {
    const d = {};

    if (v.v) d.v = v.v;
    if (v.map) d.map = v.map;
    if (v.list) d.list = v.list;
    if (v.f) d.f = v.f;

    return d;
}