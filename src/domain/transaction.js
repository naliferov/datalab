export const transactionInterface =  {
    methods: {
        'transaction.create': {
            params: {
                op: {
                    name: 'string',
                    path: 'array',
                    oldVal: 'object',
                    newVal: 'object',
                }
            }
        },
        'transaction.set': {
            params: {
                op: {
                    name: 'string',
                    path: 'array',
                    oldVal: 'object',
                    newVal: 'object',
                }
            }
        },
        'transaction.get': {
            params: { version: 'integer' },
        }
    },
};