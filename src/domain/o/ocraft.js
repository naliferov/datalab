import { Ob } from "../../gui/type/ob.js";

let bus;
let doc;

let root;
let obFactory;

const createObj = () => {
    return {}
}

const events = {
    'bus.set': (x) => bus = x.bus,
    'doc.set': (x) => {
        doc = x.doc;

        root = new Ob({ id: 'app' });
        doc.body.appendChild(root.getDOM());
    },

    'o.add': (x) => {
        const { path, o, v } = x;

        let target = root;
        if (x.target) target = x.target;

        const ob = new Ob(o);
        if (o.event) {
            for (let eType in o.event) {
                ob.on(eType, o.event[eType]);
            }
        }
        target.insert(ob);

        return ob;
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