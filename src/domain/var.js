export const Var = {
    data: 'any',
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
    map: {
        name1: 'varId',
        name2: {
            id: 'varId',
            netNodeName: 'amsterdamSmallServer',
            type: 'var | rel'
        },
    },
    list: [
        'varId1',
        'varId2',
    ],
    func: () => {}
}