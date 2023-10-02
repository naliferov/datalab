export const varcraftInterface =  {
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

        'var.search': {},
        'var.scan': {},
        'var.gatherSubVars': {},
        'var.getByPath': {},
        'var.createByPath': {},

        'var.addRelation': {}, //direct or assoc
        'var.delRelation': {},
        'var.findRelations': {},

        'storage.import': {},
        'storage.export': {},

        'server.start': {},
        'server.stop': {},
    },
    //binlog
};