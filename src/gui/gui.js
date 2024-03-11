import {
  X, b,
  dmk,
  getSize
} from "../module/x.js";
import { IndexedDb } from "../storage/indexedDb.js";
import { DataEditor } from "./mod/dataEditor/dataEditor.js";
import { DomPart } from "./mod/layout/DomPart.js";
import { Header } from "./mod/layout/Header.js";
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
await b.s('getUniqIdForDomId', async () => {

  const getRandomLetter = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet.charAt(randomIndex);
  }

  const id = await b.p('getUniqId');
  return id.replace(/^[0-9]/, getRandomLetter());
});

await b.s('port', async (x) => {

  let headers = {};
  if (x.v instanceof ArrayBuffer) {
    const x2 = { ...x };
    delete x2.v;
    headers.x = JSON.stringify({ ...x2 });
    x = x.v;
  }

  const { data } = await (new HttpClient).post('/', x, headers);
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
await b.s('signUp', async (x) => {
  console.log(x);
  //await b.p('port', { ...x, x: 'signUp' })
});

await b.s('doc.mk', async (x) => dmk(doc, x));
await b.s('doc.on', async (x) => {
  const { o, e, f } = x;
  o.addEventListener(e, f);
});
await b.s('doc.get', async (x) => doc.getElementById(x.id));
await b.s('doc.ins', async (x) => {
  const { o1, o2 } = x;
  let o1Object;
  if (typeof o1 === 'string') {
    o1Object = await b.p('doc.get', { id: o1 });
  } else {
    o1Object = o1;
  }

  let o2ob;
  if (typeof o2 === 'string') {
    o2ob = await b.p('doc.get', { id: o2 });
  } else if (o2 instanceof Node) {
    o2ob = o2;
  } else {
    o2ob = await b.p('doc.mk', o2);
  }

  o1Object.appendChild(o2ob);
  return o2ob;
});
await b.s('doc.mv', async (x) => { });
await b.s('doc.getSize', async (x) => {
  const { o } = x;
  return getSize(o);
});

const idb = new IndexedDb();
await idb.open();



const doc = globalThis.document;
const appDOM = doc.createElement('div');
appDOM.id = 'app';
doc.body.appendChild(appDOM);

const app = new DomPart();
app.setDOM(appDOM);

const header = new Header;
app.ins(header);


const path = doc.location.pathname;

if (path.startsWith('/sign/')) {

  const act = path === '/sign/in' ? 'Sign In' : 'Sign Up';

  const signForm = new DomPart({ class: 'signForm' });
  app.ins(signForm);

  const signHeader = new DomPart({ class: 'header', txt: act });
  signForm.ins(signHeader);

  const email = new DomPart({ type: 'input', class: 'email', txt: '' });
  signForm.ins(email);

  signForm.ins(new DomPart({ type: 'br' }));

  const password = new DomPart({ type: 'input', class: 'password', txt: '' });
  signForm.ins(password);

  signForm.ins(new DomPart({ type: 'br' }));

  const btn = new DomPart({ type: 'button', class: 'btn', txt: act });
  signForm.ins(btn);

  btn.on('pointerdown', async (e) => {

    if (act === 'Sign Up') {
      const user = await b.p('signUp', {
        email: email.getVal(),
        password: password.getVal(),
      });
    }
  });

} else {
  const dataEditor = Object.create(DataEditor);
  dataEditor.setB(b);
  dataEditor.set_(_);
  await dataEditor.init();
  await b.p('doc.ins', { o1: 'app', o2: dataEditor.o });

  window.onkeydown = (e) => dataEditor.keydown(e);
  window.onpointerdown = (e) => dataEditor.click(e);
}