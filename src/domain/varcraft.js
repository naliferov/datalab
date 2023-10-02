export const varcraftData =  {
    version: 0,
    deps: 'varRepository',
    methods: {
        'var.set': {
            params: { path: 'array', data: 'object' }
        },
        'var.get': {
            params: { path: 'array', depth: 'integer' }
        },
        'var.del': {},
        'var.mv': {
            params: { pathA: 'array', pathB: 'array' }
        },

        'var.scan': {},
        'var.gatherSubVars': {},
        'var.getByPath': {},
        'var.createByPath': {},

        'var.addRelation': {}, //direct or assoc
        'var.delRelation': {},
        'var.findRelations': {},
        'server.start': {},
        'server.stop': {},
        'state.bundle': {},
    },
    //binlog
};

// methods = {
//     'setData': {},
//     'set': {},
//     'get': {},
//     'del': {},
//     'setRelation': {},
//     //'addHorizontalRelation'
// }