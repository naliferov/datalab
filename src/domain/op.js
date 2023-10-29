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
// const setAtr (d, k, v) => {
//
// }