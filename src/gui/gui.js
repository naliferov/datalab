import {
  X, b,
  createSet,
  dmk,
  get,
  getSize,
  getVarData
} from "../module/x.js";
import { DataEditor } from "./mod/dataEditor/dataEditor.js";
import { Frame } from "./mod/frame/frame.js";
import { HttpClient } from "/src/transport/http.js";

const _ = Symbol('sys');
const x = X(_);
b.set_(_);
b.setX(x);

await b.s('log', async (x) => console.log(x));
await b.s('get_', () => _);
await b.s('getUniqId', () => crypto.randomUUID());
await b.s('port', async (x) => {
  const { data } = await (new HttpClient).post('/', x);
  return data;
});
//todo receive updates from backend;

await b.s('set', async (x) => {
  const _ = await b.p('get_');
  delete x[_];
  return await b.p('port', { ...x, x: 'set' });
});
await b.s('get', async (x) => {
  const { id, path, depth } = x;

  if (id) {
    return await b.p('port', { x: 'get', id });
  }
  if (path && depth !== undefined) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { b, _, createSet, getVarData };
    return await get(x);
  }
});
await b.s('del', async (x) => {
  const _ = await b.p('get_');
  delete x[_];
  x.x = 'del';
  return await b.p('port', x);
});
await b.s('cp', async (x) => {
  const _ = await b.p('get_');
  delete x[_];
  x.x = 'cp';
  return await b.p('port', x);
});

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
await b.s('doc.setStyle', async (x) => {
  const { o, style } = x;
  for (let k in style) o.style[k] = style[k];
});

const frame = Object.create(Frame);
frame.setB(b);
await frame.init();
await b.p('doc.ins', { o1: 'app', o2: frame.o });


const dataEditor = Object.create(DataEditor);
dataEditor.setB(b);
dataEditor.set_(_);
await dataEditor.init([]);

frame.setContent(dataEditor.o);

window.onkeydown = (e) => dataEditor.keydown(e);
window.onclick = (e) => dataEditor.click(e);