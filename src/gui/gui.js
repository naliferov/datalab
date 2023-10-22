import { bus as b } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { op } from "../domain/op.js";
import { DataMod } from "./mod/dataMod/dataMod.js";
import { Frame } from "./mod/frame/frame.js";
import { dmk } from "../domain/op.js";
import { HttpClient } from "/src/transport/http.js";
import { IndexedDb } from "/src/storage/indexedDb.js";

const http = new HttpClient();
const idb = new IndexedDb;
await idb.open();

const root = await idb.get('root');
if (!root) await idb.set('root', { m: {} });

await b.s('log', async (x) => console.log(x));
await b.s('getUniqId', () => crypto.randomUUID());

await b.sub('default.set', async (x) => {
    const { id, v } = x;
    return { msg: 'update complete', v };
});
await b.sub('default.get', async (x) => {
    let { id } = x;
    return await b.pub('http.post', { event: 'var.getById', id });
});

await b.sub('idb.set', async (x) => {
    const { id, v } = x;
    await idb.set(id, v);
});
await b.sub('idb.get', async (x) => {
    const { id } = x;
    return await idb.get(id);
});
await b.sub('idb.del', async (x) => {
    console.log(x);
});

const mem = {};
await b.sub('mem.set', async (x) => {
    const { id, v } = x;
    //await idb.set(id, v);
});
await b.sub('http.post', async (x) => {
    const { data } = await http.post('/', x);
    return data;
});

await v({ event: 'bus.set', bus: b });
await op('b', { b: b });

//todo add ability to send events from browser console
//const x = await v({ e: 'var.get', repo: 'idb', path: ['isDataBrowserShowed'] });
//const dataMod = new DataMod();
//await dataMod.init(bus);

//const result = await v({ event: 'var.set', repo: 'idb', path: ['isDataBrowserShowed'], data: true });
//console.log(result);

const doc = globalThis.document;
const app = doc.createElement('div');
app.id = 'app';
doc.body.appendChild(app);

let observer = new MutationObserver((e) => {
    op('doc.mutated', { data: e });
});
observer.observe(doc, {
    subtree: true, childList: true,
    attributes: true, attributeOldValue: true,
    characterData: true, characterDataOldValue: true
});

await b.s('doc.mk', async (x) => {
    if (!x.id) x.id = await b.p('getUniqId');
    return dmk(doc, x);
});
await b.s('doc.on', async (x) => {
    const { o, e, f } = x;
    o.addEventListener(e, f);
});
await b.s('doc.get', async (x) => doc.getElementById(x.id));
await b.s('doc.ins', async (x) => {
    const { o1, o2 } = x;
    let o1ob;
    if (typeof o1 === 'string') {
        o1ob = await b.p('doc.get', { id: o1 });
    } else {
        o1ob = o1;
    }

    let o2ob;
    if (typeof o2 === 'string') {
        o2ob = await b.p('doc.get', { id: o2 });
    } else if (o2 instanceof Node) {
        o2ob = o2;
    } else {
        o2ob = await b.p('doc.mk', o2);
    }

    o1ob.appendChild(o2ob);

    return o2ob;
});
await b.s('doc.mv', async (x) => {});
await b.s('doc.setStyle', async (x) => {
    const { o, style } = x;
    for (let k in style) o.style[k] = style[k];
});

//const objectId = await op('i', { o1: 'app', o2: { txt: 'test'} });

const fr = Object.create(Frame);
fr.setB(b);
await fr.init();

await op('i', { o1: 'app', o2: fr.o });

const dataMod = Object.create(DataMod);
dataMod.setB(b);
//await op('i', { o1: 'app', o2: frame.o });

//frame.setO(O);
//await frame.init();

//console.log(frame);