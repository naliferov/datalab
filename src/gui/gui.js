import { bus } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { ocraft } from "../domain/ocraft.js";
import { HttpClient } from "/src/transport/http.js";
import { IndexedDb } from "/src/storage/indexedDb.js";

const doc = globalThis.document;
const http = new HttpClient();
const idb = new IndexedDb;
await idb.open();

const root = await idb.get('root');
if (!root) await idb.set('root', { map: {} });

await bus.sub('log', async (x) => console.log(x));
await bus.sub('getUniqId', () => crypto.randomUUID());
await bus.sub('repo.set', async (x) => {
    //const { id, v } = x;
    //send to Server
    //await varRepository.set(id, v);
    return { msg: 'update complete', v };
});
await bus.sub('repo.get', async (x) => {
    let { id } = x;
    return await bus.pub('http.post', { event: 'var.getById', id });
});
await bus.sub('idb.set', async (x) => {
    console.log(x);
});
await bus.sub('idb.get', async (x) => {
    const { id } = x;
    return await idb.get(id);
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

await bus.sub('http.post', async (x) => {
    const { data } = await http.post('/', x);
    return data;
});

//const rootData = await v({ event: 'var.get', path: ['root'], depth: 3 });
//console.log(rootData);

const result = await v({ event: 'var.set', path: ['ctx', 'idb', 'isDataBrowserShowed'], data: true });
//console.log(result);

//const result = await v({ event: 'var.get', path: ['ctx', 'idb', 'root'] });
//console.log(result);


//const result = await v({ event: 'var.get', div: 'idb', path: ['idb', 'root'], data: true });
//console.log(result);