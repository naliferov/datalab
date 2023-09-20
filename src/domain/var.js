export const Var = {
    //id
    //meta
}
export const VarMeta = {}
export const VarRelation = {
    direct: {
        varId1: 1,
        varId2: 1
    },
    assoc: {
        name: 'varId',
        name2: {
            netNodeName: 'amsterdamSmallServer',
            id: 'varId'
        }
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