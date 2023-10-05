import { varcraftInterface } from "/src/domain/varcraftInterface.js";
import { IndexedDBStorage } from "/src/storage/indexedDBStorage.js";
import { Frame } from "./frame/frame.js";
import { HttpClient } from "/src/transport/http.js";
import { ServerRepository } from "/src/repository/serverRepository.js";
import { IndexedDBRepository } from "/src/repository/indexedDBRepository.js";

const cmd = {};
const varcraft = {
    'var.set': async (meta, path, data) => {
        //notify netNodes backend
    },
    'var.get': async (meta, path = [], depth) => {
        return await meta.getByPath(path);
    },
};

for (const method in varcraftInterface.methods) {
    if (!varcraft[method]) continue;
    cmd[method] = varcraft[method];
}

//import {CodeJar} from 'https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.min.js';
//console.log(CodeJar);
//const openIndexedDb = () => {
//     return new Promise((resolve, reject) => {
//
//         const openRequest = indexedDB.open('varcraft');
//         openRequest.onerror = () => {
//             reject(openRequest.error);
//         };
//         openRequest.onsuccess = () => {
//             resolve(openRequest.result);
//         };
//         openRequest.onupgradeneeded = () => {
//             let db = openRequest.result;
//             if (!db.objectStoreNames.contains('vars')) {
//                 db.createObjectStore('vars');
//             }
//         };
//     });
// }
//const db = await openIndexedDb();

//const varStorage = new IndexedDBStorage(db);
//await varStorage.set('root', {map: {frontend: 937}});

//const varRepository = new IndexedDBRepository();
const serverRepository = ServerRepository;

//console.log(varRepository);
//const http = new HttpClient;

const app = new Frame({id: 'app'});
document.body.appendChild(app.getDOM());

//const root = await cmd['var.get'](indexedDBRepository, ['root'], 2);

//const frontend = await cmd['var.get'](indexedDBRepository, ['frontend'], 2);
//console.log(frontend);

for (let name in frontend) {
    continue;

    if (name === 'mainDiv') continue;

    const block = frontend[name];

    const div = new Frame;
    app.insert(div);

    for (let prop in block) {
        if (prop === 'txt') {
            //const txt = new Frame;
            //div.insert(txt);
            //console.log(block[prop]);

            div.setTxt(block[prop].data);
            continue;
        }
        div.setStyles({ [prop]: block[prop].data });
    }
}
