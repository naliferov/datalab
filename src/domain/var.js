//Every var has id.

export const Var = {
    calc: (deps) => {}
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