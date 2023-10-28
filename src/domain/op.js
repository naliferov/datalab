let b;

const events = {
    'b': x => b = x.b,

    'i': async (x) => {
        const { path, o1, o2, v } = x;

        //const o1obj = await b.p('doc.get', { id: o1 });
        if (o2) {
            const id = await b.p('doc.ins', { o1, o2 });
            //console.log(id);
        }

        //const object = new O(o);
        //if (o.event) {
          //  for (let eType in o.event) object.on(eType, o.event[eType]);
        //}
        //target.insert(object);

        //return object;
    },
    'doc.mutate': (x) => {
        //console.log(x);
    }
}

export const toRight = (o, targetO) => {
    const { x, y, width } = targetO.getSize();
    o.absolute();
    o.setPosition(x + width + 10, y);
}

//const varRepository = new VarRepository(new NetStorage(bus));
//separate style from pure logic

export const mkOb = (x) => {
    //todo opObject //dataObj // tick, add, subtract
    //o, msg, num, list, symbol, comment
    const data = {
        txt: x.txt,
        event: {
            //can attach any custom handler with specific connection mechanics build in UI.
            //click: () => {}
        },
    }
    if (x.style) data.style = x.style;

    return data;
}

//tick, add, subtract, move and etc.
export const mkOp = {
    txt: '+',
    style: {
        display: 'inline-block',
        cursor: 'pointer',
        'fontWeight': 'bold',
        margin: '1em'
    },
    // event: {
    //     click: async (e) => {
    //         const o = createOb();
    //         await op({ event: 'o.add', o: o });
    //     }
    // }
};

const on = (id, eventName, callback) => {
    //add event to id!
    //dom.addEventListener(eventName, callback);
}

const m = () => {

}
export const dmk = (d, x) => {
    const { id, type, txt } = x;

    const o = d.createElement(type || 'div');
    if (txt) o.innerText = txt;

    const classD = x['class'];
    if (classD) {
        o.className = Array.isArray(classD) ? classD.join(' ') : classD;
    }
    return o;
}
const dragAndDrop = () => {

}
const insert = (o) => {
    //if (this.shadow) this.shadow.appendChild(view.getDOM());
    //this.dom.appendChild(view.getDOM());
}
// const setAtr (d, k, v) => {
//
// }

export const op = async (e, x) => {
    if (!events[e]) return 'Command not found';
    return await events[e](x);
}

