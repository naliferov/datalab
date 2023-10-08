import { bus } from "../domain/bus.js";
import { varcraft as v } from "../domain/varcraft.js";
import { docraft } from "../domain/doc/docraft.js";

import { Frame } from "./frame/frame.js";
import { HttpClient } from "/src/transport/http.js";
import { NetStorage } from "/src/storage/netStorage.js";
import { VarRepository } from "/src/varRepository.js";

await bus.sub('log', async (x) => console.log(x));
await bus.sub('getUniqId', () => ulid());

await bus.sub('repo.set', async (x) => {
    const { id, v } = x;
    //send to Server
    //await varRepository.set(id, v);
    return { msg: 'update complete', v };
});

await v({ event: 'bus.set', bus });
await docraft({ event: 'bus.set', bus });

//use events instead, set mode: canvas, DOM
await docraft({ event: 'doc.set', doc: globalThis.document });
//DOMMode, canvasMode, markdown

const varRepository = new VarRepository(new NetStorage(bus));
//const http = new HttpClient;

//await docraft({ event: 'obj.add', path: ['frontend.mainPage'] });

//const docObject = await docraft({ event: 'obj.remove', path: ['front'] });

const data = {};
const opFactory = {};
//op can be mod

await bus.pub('doc.insertPart', async (x) => console.log(x));
//modFactory = {};





//create sandbox building blocks

//const frontend = await cmd['var.get'](indexedDBRepository, ['frontend'], 2);
//console.log(frontend);

// for (let name in frontend) {
//     continue;
//
//     if (name === 'mainDiv') continue;
//
//     const block = frontend[name];
//
//     const div = new Frame;
//     app.insert(div);
//
//     for (let prop in block) {
//         if (prop === 'txt') {
//             //const txt = new Frame;
//             //div.insert(txt);
//             //console.log(block[prop]);
//
//             div.setTxt(block[prop].data);
//             continue;
//         }
//         div.setStyles({ [prop]: block[prop].data });
//     }
// }



const app = new Frame({id: 'app'});
document.body.appendChild(app.getDOM());

