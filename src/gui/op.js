export const toRight = (o, targetO) => {
    const {x, y, width} = targetO.getSize();

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
    //         await ocraft({ event: 'o.add', o: o });
    //     }
    // }
};