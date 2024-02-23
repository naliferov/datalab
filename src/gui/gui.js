import {
  X, b,
  dmk,
  getSize
} from "../module/x.js";
import { IndexedDb } from "../storage/indexedDb.js";
import { DataEditor } from "./mod/dataEditor/dataEditor.js";
import { Frame } from "./mod/frame/frame.js";
import { HttpClient } from "/src/transport/http.js";

if (!Array.prototype.at) {
  Array.prototype.at = function (index) {
    return index < 0 ? this[this.length + index] : this[index];
  }
}

const _ = Symbol('sys');
const x = X(_);
b.set_(_);
b.setX(x);

await b.s('log', async (x) => console.log(x));
await b.s('get_', () => _);
await b.s('getUniqId', () => {

  if (!window.crypto || !window.crypto.randomUUID) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function (c) {
        const uuid = Math.random() * 16 | 0, v = c == 'x' ? uuid : (uuid & 0x3 | 0x8);
        return uuid.toString(16);
      });
  }
  return crypto.randomUUID();
});
await b.s('port', async (x) => {
  const { data } = await (new HttpClient).post('/', x);
  return data;
});
await b.s('set', async (x) => {
  if (x.repo === 'idb') {
    return await idb.set(x);
  }
  return await b.p('port', { ...x, x: 'set' });
});
await b.s('get', async (x) => {
  if (x.repo === 'idb') {
    return await idb.get(x);
  }
  return await b.p('port', { ...x, x: 'get' });
});
await b.s('del', async (x) => await b.p('port', { ...x, x: 'del' }));
await b.s('cp', async (x) => await b.p('port', { ...x, x: 'cp' }));

const doc = globalThis.document;
const app = doc.createElement('div');
app.id = 'app';
doc.body.appendChild(app);

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
await b.s('doc.mv', async (x) => { });
await b.s('doc.getSize', async (x) => {
  const { o } = x;
  return getSize(o);
});

const frame = Object.create(Frame);
frame.setB(b);
await frame.init();
await b.p('doc.ins', { o1: 'app', o2: frame.o });

const idb = new IndexedDb();
await idb.open();

const dataEditor = Object.create(DataEditor);
dataEditor.setB(b);
dataEditor.set_(_);
await dataEditor.init();

frame.setContent(dataEditor.o);

window.onkeydown = (e) => dataEditor.keydown(e);
window.onclick = (e) => dataEditor.click(e);