const createVar = async (bus, type) => {
    const v = type === 'data' ? { data: '_stub_' } : { map: {} };

    v.id = await bus.pub('getUniqId');
    v.new = true;

    return v;
}

export const createVarSetByPath = async (x) => {

    const { bus, path, isNeedStopIfVarNotFound } = x;

    let v1 = await bus.pub('var.getById', 'root');
    v1.id = 'root';
    let set = [ v1 ];

    for (let i = 0; i < path.length; i++) {
        const name = path[i];
        if (!name) return;

        const v1 = set.at(-1);
        let v2;

        let id = v1.map[name];
        if (id) {
            v2 = await bus.pub('var.getById', id);
            v2.id = id;
            //todo v2.data or (v2.map or v2.list)
            //createTransaction
        }
        if (!v2) {
            if (isNeedStopIfVarNotFound) return;

            v2 = createVar(i === path.length - 1);
            //createTransaction

            v1.map[name] = v2.id;
            v1.updated = 1;
        }
        v2.name = name;

        set.push(v2);
    }

    return set;
}

export const gatherVarDataByDepth = async (bus, v, depth) => {
    const data = {};

    if (!v.map) return data;

    //todo list case or function case
    for (let prop in v.map) {
        const id = v.map[prop];
        if (!id) return;

        if (depth === 0) {
            data[prop] = id;
            continue;
        }

        const v2 = await bus.pub('var.getById', id);
        if (v2.map) {
            data[prop] = await gatherVarDataByDepth(v2, depth - 1);
        } else if (v2.data) {
            data[prop] = v2;
        }
    }
    return data;
}
