let bus;
let doc;

//use dom as map, store dom
//store data in dom

const createObj = () => {
    return {}
}

const c = {
    'bus.set': (x) => bus = x.bus,
    'doc.set': (x) => doc = x.document,
    'obj.add': (x) => {
        const { path } = x;
        //repo.getByPath;
    },
}

export const docraft = async x => {
    const { cmd } = x;

    if (!c[cmd]) {
        return 'Command not found';
    }
    return await c[cmd](x);
}