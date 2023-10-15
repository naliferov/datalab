let bus;
let div;

const events = {
    'setBus': () => {},
    'set': (x) => bus = x.bus,
    'get': async (x) => {},
    'del': async (x) => {},
    'mv': {},
    'watch': {},
    'search': {},
}

export const metacraft = async x => {
    const { event } = x;

    if (!events[event]) {
        return `Command [${event}] not found`;
    }
    return await events[event](x);
}