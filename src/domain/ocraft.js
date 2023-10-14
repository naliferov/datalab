import { O } from "../gui/type/o.js";

let bus;
let doc;
let root;

const events = {
    'bus.set': (x) => bus = x.bus,
    'doc.set': (x) => {
        doc = x.doc;

        root = new O({ id: 'app' });
        doc.body.appendChild(root.getDOM());
    },

    'o.add': (x) => {
        const { path, o, v } = x;

        let target = root;
        if (x.target) target = x.target;

        const object = new O(o);
        if (o.event) {
            for (let eType in o.event) object.on(eType, o.event[eType]);
        }
        target.insert(object);

        return object;
    },
    'doc.mutated': (x) => {
        //console.log(x);
    }
}

export const ocraft = async x => {
    const { event } = x;

    if (!events[event]) {
        return 'Command not found';
    }
    return await events[event](x);
}