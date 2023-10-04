export const varcraftInterface =  {
    version: 0,
    deps: 'varRepository',
    methods: {
        'var.set': {
            params: { meta: '', path: 'array', data: '' }
        },
        'var.get': {
            params: { meta: '', path: 'array', depth: 'integer' }
        },
        'var.del': {},
        'var.mv': {
            params: { pathA: 'array', pathB: 'array' }
        },

        'var.connect': {},
        'var.watch': {},

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
        'storage.countItems': {},

        'server.start': {},
        'server.stop': {},
    },
};