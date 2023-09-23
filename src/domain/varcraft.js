export const varcraftData =  {
    version: 0,
    deps: 'varRepository',
    methods: {
        'var.set': {
            params: {path: 'array', data: 'object'}
        },
        'var.get': {},
        'var.getRaw': {},
        'var.del': {},
        'var.addRelation': {}, //direct or assoc
        'var.delRelation': {},
        'var.findRelations': {},
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