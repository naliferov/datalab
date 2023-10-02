export const varStorageInterface =  {
    version: 0,
    deps: 'varStorage',
    methods: {
        'set': {
            params: { path: 'array', data: 'object' }
        },
        'get': {
            params: { path: 'array', depth: 'integer' }
        },
        'del': {},
    },
    //binlog
};