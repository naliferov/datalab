const T_v = 1;
const T_map = 2;
const T_list = 4;
const T_fn = 5;
const T_link = 6;

export const Var = {
    v: 'any',
    calc: (deps) => {}
}
export const VarMeta = {}
export const VarRelation = { //var relation has id of var
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