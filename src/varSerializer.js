export class VarSerializer {
    serialize(v) {
        const d = {};
        if (v.data) d.data = v.data;
        if (v.map) d.map = v.map;
        if (v.list) d.list = v.list;
        return d;
    }
}