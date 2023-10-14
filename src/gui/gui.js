import { bus } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { ocraft } from "../domain/o/ocraft.js";
import { HttpClient } from "/src/transport/http.js";

const openIndexedDb = () => {
    return new Promise((resolve, reject) => {

        const openRequest = indexedDB.open('varcraft');
        openRequest.onerror = () => {
            reject(openRequest.error);
        };
        openRequest.onsuccess = () => {
            resolve(openRequest.result);
        };
        openRequest.onupgradeneeded = () => {
            let db = openRequest.result;
            if (!db.objectStoreNames.contains('vars')) {
                db.createObjectStore('vars');
            }
        };
    });
}
const db = await openIndexedDb();


const doc = globalThis.document;
const http = new HttpClient();
await bus.sub('http.post', async (x) => {

    const { data } = await http.post('/', x);
    return data;
});

await bus.sub('log', async (x) => console.log(x));
await bus.sub('getUniqId', () => crypto.randomUUID());
await bus.sub('repo.set', async (x) => {
    //const { id, v } = x;
    //send to Server
    //await varRepository.set(id, v);
    return { msg: 'update complete', v };
});

await bus.sub('repo.get', async (x) => {

    let id;
    if (typeof x === 'string') {
        id = x;
    } else if (typeof x === 'object') {
        let { path, depth } = x;
        //return await bus.pub('http.post', { event: 'var.get', path, depth });
    }
    return await bus.pub('http.post', { event: 'var.getById', id });
});

await bus.sub('ctx.db.get', async (x) => {

    if (typeof x === 'object') {
        let { path, depth } = x;
        //return await bus.pub('http.post', { event: 'var.get', path, depth });
    }
});
// await bus.sub('repo.getByPath', async (id) => {
//
//     const v = await bus.pub('http.post', {
//         event: 'var.getById',
//         id: id,
//     });
//     console.log(v);
//
//     return v;
// });

//const http = new HttpClient;

await bus.sub('server.sendMsg', async (x) => {

    //send message depends on type of transport
    return { msg: 'update complete', v };
});

await v({ event: 'bus.set', bus });
await ocraft({ event: 'bus.set', bus });
await ocraft({ event: 'doc.set', doc });

let observer = new MutationObserver((e) => {
    ocraft({ event: 'doc.mutated', data: e  })
});
observer.observe(doc, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true
});

//const varRepository = new VarRepository(new NetStorage(bus));
//separate style from pure logic

const makeOb = (x) => {
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
//tick, add, subtract
const makeOp = {
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

const add = async (o, target) => await ocraft({ event: 'o.add', o, target });

//const smallTxtEdit = makeOb();
const smallTxtEdit = await add({
    tagName: 'textarea',
    txt: 'Field editor',
    editable: true,
    style: {
        position: 'absolute',
        right: 0,
        width: '250px',
        height: '20px',
        border: '1px solid black',
        outline: 'none',
        fontFamily: "'Roboto', Arial, sans-serif",
        fontSize: '15px'
    }
});
//smallTxtEdit.toggleEdit();

const render = async (o, parentRow) => {
    for (let p in o) {

        if (p === 'map') {
            //await render(o[p], parentRow);
            //continue;
        } else if (p === 'v') {
            let txt = o[p];
            if (txt) txt = txt.split('\n')[0];
            await add({ txt, style: { display: 'inline' }}, parentRow);
            continue;
        }

        const row = await add({ style: { marginLeft: '10px'} }, parentRow);
        await add({ txt: p, style: { display: 'inline', fontWeight: 'bold' }}, row);
        await add({ txt: ': ', style: { display: 'inline' }}, row);

        const val = o[p];

        if (p === 'map') {
            await render(o[p], row);
        } else if (typeof val === 'object' && val !== null) {
            await render(val, row);
        }
    }
}

const dataViewer = await add({class: 'dataViewer', style: {
    display: 'inline-block',
    border: '1px solid black'
}});
await render(await v({ event: 'var.get', path: ['root'], depth: 4 }), dataViewer);