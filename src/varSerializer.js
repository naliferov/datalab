export class VarSerializer {

    serialize(v) {
        if (v.data) {
            return { data: v.data };
        }
        if (!v.assoc && !v.direct) return;

        const result = {};
        if (v.assoc) result.assoc = v.assoc;
        return result;
    }
}