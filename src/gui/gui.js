import { bus } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { ocraft } from "../domain/ocraft.js";
import { HttpClient } from "/src/transport/http.js";
import { IndexedDb } from "/src/storage/indexedDb.js";
import { toRight } from "/src/gui/op.js";

const doc = globalThis.document;
const http = new HttpClient();
const indexedDb = new IndexedDb;
await indexedDb.open();

// await indexedDb.set('root', {
//     omg: 'this is VALUE 88620 99 000',
// });

//console.log(await indexedDb.get('root'));

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
await bus.sub('ctx.db.set', async (x) => {
    if (typeof x === 'object') {
        let { path, depth } = x;
        //return await bus.pub('http.post', { event: 'var.get', path, depth });
    }
});

await v({ event: 'bus.set', bus });
await ocraft({ event: 'bus.set', bus });
await ocraft({ event: 'doc.set', doc });

let observer = new MutationObserver((e) => {
    ocraft({ event: 'doc.mutated', data: e  })
});
observer.observe(doc, {
    subtree: true, childList: true,
    attributes: true, attributeOldValue: true,
    characterData: true, characterDataOldValue: true
});

const add = async (o, target) => await ocraft({ event: 'o.add', o, target });

const render = async (o, parentRow) => {
    for (let p in o) {

        if (p === 'map') {
            await render(o[p], parentRow);
            continue;
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

const dataBrowser = await add({ class: 'dataBrowser', style: {border: '1px solid black'} });
dataBrowser.absolute();

await add({ txt: 'Data Browser', class: 'header', style: {
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '10px',
}}, dataBrowser)
//dataEditor.container

const root = await v({ event: 'var.get', path: ['root'], depth: 4 });
console.log(root);
await render(root, dataBrowser);

// const txtEdit = await add({
//     txt: 'Text dataBrowser',
//     editable: true,
//     style: {
//         width: '250px', height: '20px',
//         border: '1px solid black', outline: 'none',
//         fontFamily: "'Roboto', Arial, sans-serif", fontSize: '15px'
//     }
// });

//toRight(txtEdit, dataViewer);