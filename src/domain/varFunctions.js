const createVar = async (bus, type) => {
    let v = {
        id: await bus.pub('getUniqId'),
        new: true,
    };

    if (type === 'data') {
        v.data = '_stub_';
    } else {
        v.map = {};
    }

    return v;
}

export const createVarSetByPath = async (x) => {

    const { bus, path, isNeedStopIfVarNotFound } = x;

    let v1 = await bus.pub('repo.get', 'root');
    v1.id = 'root';
    let set = [ v1 ];

    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) return;

        const v1 = set.at(-1);
        let v2;

        let id = v1.map[name];
        if (id) {
            v2 = await bus.pub('repo.get', id);
            v2.id = id;
        }
        if (!v2) {
            if (isNeedStopIfVarNotFound) return;

            v2 = await createVar(bus, (i === path.length - 1) ? 'data': 'map');

            v1.map[name] = v2.id;
            if (!v1.new) v1.updated = true;
        }
        v2.name = name;

        set.push(v2);
    }

    return set;
}

export const gatherVarDataByDepth = async (x) => {

    const { bus, v, depth } = x;

    const data = {};

    if (!v.map) return data;

    for (let prop in v.map) {

        const id = v.map[prop];
        if (!id) return;

        if (depth === 0) {
            data[prop] = id;
            continue;
        }

        const v2 = await bus.pub('repo.get', id);
        if (v2.map) {
            data[prop] = await gatherVarDataByDepth({ bus, v: v2, depth: depth - 1 });
        } else if (v2.data) {
            data[prop] = v2;
        }
    }
    return data;
}

export const prepareForTransfer = (v) => {
    const d = {};
    if (v.data) d.data = v.data;
    if (v.map) d.map = v.map;
    if (v.list) d.list = v.list;
    return d;
}