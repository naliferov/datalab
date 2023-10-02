export class VarSerializer {

    serialize(v) {
        if (v.data) {
            return { data: v.data };
        }

        if (!v.map && !v.direct) return;

        const result = {};
        if (v.map) result.map = v.map;
        if (v.list) result.list = v.list;
        return result;
    }
}