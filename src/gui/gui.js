import { bus } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { op } from "../domain/op.js";
import { O } from "/src/gui/type/o.js"
import { IndexedDb } from "/src/storage/indexedDb.js";
import { DataBrowser } from "./mod/dataBrowser/dataBrowser.js";
import { HttpClient } from "/src/transport/http.js";
import { Frame } from "./mod/frame/frame.js";

const http = new HttpClient();
const idb = new IndexedDb;
await idb.open();

const root = await idb.get('root');
if (!root) await idb.set('root', { m: {} });

await bus.sub('log', async (x) => console.log(x));
await bus.sub('getUniqId', () => crypto.randomUUID());

await bus.sub('default.set', async (x) => {
    const { id, v } = x;
    return { msg: 'update complete', v };
});
await bus.sub('default.get', async (x) => {
    let { id } = x;
    return await bus.pub('http.post', { event: 'var.getById', id });
});

await bus.sub('idb.set', async (x) => {
    const { id, v } = x;
    await idb.set(id, v);
});
await bus.sub('idb.get', async (x) => {
    const { id } = x;
    return await idb.get(id);
});
await bus.sub('idb.del', async (x) => {
    console.log(x);
});

const mem = {};
await bus.sub('mem.set', async (x) => {
    const { id, v } = x;
    //await idb.set(id, v);
});
await bus.sub('http.post', async (x) => {
    const { data } = await http.post('/', x);
    return data;
});

await v({ event: 'bus.set', bus });

const o = new O({ id: 'app' });

await op({ event: 'o.set', o: O });
await op({ event: 'bus.set', bus });
await bus.sub('get.craft', () => op);

//todo add ability to send events from browser console
const x = await v({ event: 'var.get', repo: 'idb', path: ['isDataBrowserShowed'] });
if (x) {
    //render
}

const dataBrowser = new DataBrowser();
//await dataBrowser.init(bus);

//const result = await v({ event: 'var.set', repo: 'idb', path: ['isDataBrowserShowed'], data: true });
//console.log(result);

let observer = new MutationObserver((e) => {
    op({ event: 'doc.mutated', data: e  });
});
const doc = globalThis.document;
observer.observe(doc, {
    subtree: true, childList: true,
    attributes: true, attributeOldValue: true,
    characterData: true, characterDataOldValue: true
});
doc.body.appendChild(o.getDOM());

await op({ event: 'add', target: o, o: { txt: 'test' } });

const frame = Object.create(Frame);
frame.setO(O);
await frame.init();

console.log(frame);