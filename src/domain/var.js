//every entity has ID

export const Var = {
    calc: (dependencies) => {}
}
export const VarMeta = {}
export const VarRelation = { //var relation has id of var
    meta: {}, //info for description and etc
    direct: {
        varId1: {
            id: 'varId',
            type: 'var | rel'
        },
        varId2: 1
    },
    assoc: {
        name1: 'varId',
        name2: {
            id: 'varId',
            netNodeName: 'amsterdamSmallServer',
            type: 'var | rel'
        },
    }
}

// async setData(data) {
//     this.data = data;
// }
// async set(name, id) {
//     if (!this.vars) this.vars = {};
//     this.vars[name] = id;
// }
// get(name) {
//     return this.vars ? this.vars[name] : undefined;
// }
// async del(name) {
//     if (!this.vars) return;
//     delete this.vars[name];
// }