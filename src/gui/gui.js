import {
  X, b,
  dmk,
} from "../module/x.js";
import { IndexedDb } from "../storage/indexedDb.js";
import { DataEditor } from "./mod/dataEditor/dataEditor.js";
import { Frame } from "./mod/frame/frame.js";
import { DomPart } from "./mod/layout/DomPart.js";
import { Header } from "./mod/layout/Header.js";
import { HttpClient } from "/src/transport/http.js";

if (!Array.prototype.at) {
  Array.prototype.at = function (i) {
    return i < 0 ? this[this.length + i] : this[i];
  }
}

const _ = Symbol('sys');
const x = X(_);
b.set_(_);
b.setX(x);

globalThis.vc = b;

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
await b.s('getUniqIdForDom', async () => {

  const getRandomLetter = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet.charAt(randomIndex);
  }
  const id = await b.p('getUniqId');
  return id.replace(/^[0-9]/, getRandomLetter());
});
await b.s('x', async (x) => {
  if (x.repo === 'idb') {
    if (x.set) await idb.set(x.set);
    if (x.get) return await idb.get(x.get);
    return;
  }
  return await b.p('port', x);
});
await b.s('port', async (x) => {

  let headers = {};
  if (x.set && x.set.v instanceof ArrayBuffer) {

    const v = x.set.v; delete x.set.v;
    headers.x = JSON.stringify(x);
    x = v;
  }

  const { data } = await (new HttpClient).post('/', x, headers);
  return data;
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

const app = new DomPart;
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
      const r = await b.p('x', {
        signUp: {
          email: email.getVal(),
          password: password.getVal(),
        }
      });
      console.log(r);
    }
  });

} else {

  const dataEditor = Object.create(DataEditor);
  dataEditor.setB(b);
  dataEditor.set_(_);
  await dataEditor.init();

  const frame = Object.create(Frame);
  frame.setB(b);
  await frame.init();
  frame.setContent(dataEditor.o);

  appDOM.append(frame.o);


  //const customHtml = await b.p('doc.mk', { html: 'okokok', class: 'customHtml' });
  //appDOM.append(customHtml);


  window.onkeydown = (e) => dataEditor.keydown(e);
}