globalThis.s ??= {};
s.sys ??= {};
const sys = s.sys;

sys.sym ??= {};
sys.sym.FN ??= Symbol('fn');
sys.sym.IS_EMPTY ??= Symbol('isEmptyNode');
sys.sym.IS_LOADED_FROM_DISC ??= Symbol('isLoadedFromDisc');
sys.sym.TYPE_OBJECT ??= Symbol('typeObject');
sys.sym.TYPE_PATH ??= Symbol('typePath');

Object.defineProperty(s, 'd', {
    writable: true, configurable: true, enumerable: false,
    value: (k, v) => Object.defineProperty(s, k, { writable: true, configurable: true, enumerable: false, value: v })
});
Object.defineProperty(s, 'def', {
    writable: true, configurable: true, enumerable: false,
    value: (k, v) => Object.defineProperty(s, k, { writable: true, configurable: true, enumerable: false, value: v })
});
Object.defineProperty(s, 'defObjectProp', {
    writable: true, configurable: true, enumerable: false,
    value: (o, k, v) => Object.defineProperty(o, k, { writable: true, configurable: true, enumerable: false, value: v })
});
s.l = console.log;

//GLOBAL PUB SUB
// s.defObjectProp(sys, 'eventHandlers', {});
// globalThis.e = new Proxy(() => { }, {
//   apply(target, thisArg, args) {
//     const handler = args[0];
//     const data = args[1];
//
//     if (sys.eventHandlers[handler]) {
//       return sys.eventHandlers[handler](data);
//     }
//   },
//   set(target, k, v) {
//     sys.eventHandlers[k] = v;
//     return true;
//   }
// });
// s.d('e', e);

// if (isBrowser) {
//   s.d('fetchState', async path => {
//     const res = await fetch('/state', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ path: path.split('.') }),
//     });
//     return await res.json();
//   });
//
//   sys.proxyS = {};
//   globalThis.s = new Proxy(s, sys.proxyS);
//
//   const GUI = new (await s.f('sys.apps.GUI/mainJs'));
//   await GUI.start();
//   return;
// }


s.d('find', (path, nodeForSearch) => {
    let node = s;
    if (s.isObject(nodeForSearch)) node = nodeForSearch;

    const pathArr = s.pathToArr(path);
    return s.findByArray(pathArr, node);
});
s.d('findByArray', (path, nodeForSearch) => {
    let node = s;
    if (s.isObject(nodeForSearch)) node = nodeForSearch;

    for (let i = 0; i < path.length; i++) {
        if (typeof node !== 'object' || node === null) {
            return;
        }
        node = node[path[i]];
    }
    return node;
});
s.d('findParentAndK', (path, nodeForSearch) => {

    const pathArr = s.pathToArr(path);
    let node = s;
    if (s.isObject(nodeForSearch)) node = nodeForSearch;

    return {
        parent: pathArr.length === 1 ? node : s.find(pathArr.slice(0, -1), node),
        k: pathArr.at(-1)
    };
});
s.d('f', async (path, ...args) => {
    try {
        //todo node to stream
        let node = s.find(path);
        if (!node) {

            if (isBrowser) {
                const { js } = await s.fetchState(path);
                if (js) node = await s.u({ path, type: 'js', val: js });
            } else {
                if (!await s.isPathExistsOnFS(path, 'js')) return;
                node = await s.u({ path, type: 'js', options: { useFS: true } });
            }
        }

        let js;
        if (node[sys.sym.TYPE_STREAM]) js = node.get();
        else if (node.js) js = node.js;

        if (!js) {
            console.log(`js not found by path [${path}]`);
            return;
        }
        //if (!node[sys.sym.FN]) node[sys.sym.FN] = eval(node.js);
        return eval(js)(...args);

    } catch (e) { console.error(path, e); }
});

s.d('pathToFSPath', path => `state/${s.pathToArr(path).join('/')}`);
s.d('isPathExistsOnFS', async (path, fileExtension = '') => {
    const fsPath = s.pathToFSPath(path) + (fileExtension ? '.' + fileExtension : '');
    return await s.fsAccess(fsPath);
});
s.d('getFromFS', async (path, format = 'json') => {

    let fsPath = s.pathToFSPath(path);
    if (!await s.fsAccess(fsPath)) return;

    if (format === 'json') fsPath += '.json';

    const str = (await s.nodeFS.readFile(fsPath, 'utf8')).trim();
    return format === 'json' ? JSON.parse(str) : str;
});
s.d('cpFromFS', async (path, format = 'json', hiddenProps = {}) => {
    const v = await s.getFromFS(path, format);
    if (!v) return;
    s.set(path, v, hiddenProps);
});
s.d('syncFromDisc', async (path, format = 'json', hiddenProps = {}) => {

    const state = await s.getFromFS(path, format);
    if (!state) return;

    const currentState = s.find(path);
    for (let k in currentState) {
        if (!state[k]) delete currentState[k];
    }
    //delete what not exists in state
    s.merge(currentState, state);
    s.l('syncFromDisc', path, Object.keys(state).length);
});
s.d('cpToDisc', async (path, v = null, hiddenProps = {}) => {

    let pathArr = s.pathToArr(path);

    const dir = `state/${pathArr.slice(0, -1).join('/')}`;
    let file = `${dir}/${pathArr.at(-1)}.`;

    if (!await s.fsAccess(dir)) return;
    if (!v) v = s.find(pathArr);
    if (!v) return;

    if (typeof v === 'object' && v !== null) {
        file += 'json';

        if (hiddenProps.each) {
            const clone = structuredClone(v);
            for (let k in v) {
                clone[k][hiddenProps.each] = v[k][hiddenProps.each];
            }
            v = clone;
        } else if (hiddenProps.one) {
            const clone = structuredClone(v);
            const pathArray = s.pathToArr(hiddenProps.one);

            const { parent, k } = s.findParentAndK(hiddenProps.one, clone);
            parent[k] = s.find(pathArray, v);

            v = clone;
        }
        v = JSON.stringify(v);
    } else {
        file += 'txt';
        v = String(v);
    }
    await s.nodeFS.writeFile(file, v);
});
s.nodeFS.isExists = async path => {
    try { await s.nodeFS.access(path); return true; }
    catch { return false; }
}

s.d('fsChangesStream', path => {
    return {
        isStarted: false,
        ac: new AbortController,
        start: async function () {
            if (this.isStarted) return;
            this.generator = await s.nodeFS.watch(path, { signal: this.ac.signal });
            for await (const e of this.generator) if (this.eventHandler) await this.eventHandler(e);
            s.l('fsChangesStream STARTED');
            this.isStarted = true;
        },
        stop: function () { this.ac.abort(); },
        eventHandler: null,
    }
});
s.d('create', path => {
    let pathArr = s.pathToArr(path);
    let node = s;

    for (let i = 0; i < pathArr.length; i++) {
        const k = pathArr[i];
        if (typeof node[k] !== 'object' || node[k] === null) {
            node[k] = {};
        }
        node = node[k];
    }
    return node;
});
s.d('set', (path, v, hiddenProps = {}) => {

    const pathArr = s.pathToArr(path);
    if (pathArr.length > 1) {
        s.create(pathArr.slice(0, -1));
    }
    const { parent, k } = s.findParentAndK(pathArr);
    if (!parent || !k || !v) return;

    //HIDE PROP LOGIC move to other function
    const hiddenPropsIsEmpty = Object.keys(hiddenProps).length === 0;
    if (hiddenPropsIsEmpty) {
        parent[k] = v; return;
    }
    if (hiddenProps.prop) {
        s.defObjectProp(parent, k, parent[k]); return;
    }
    if (hiddenProps.one) {
        const vData = s.findParentAndK(hiddenProps.one, v);
        s.defObjectProp(vData.parent, vData.k, vData.parent[vData.k]);
        parent[k] = v;
        return;
    }
    if (hiddenProps.each) {
        if (typeof v === 'object' && !Array.isArray(v)) {
            for (let k in v) {
                const obj = v[k];
                const vData = s.findParentAndK(hiddenProps.each, obj);

                s.defObjectProp(vData.parent, vData.k, vData.parent[vData.k]);
            }
        }
    }
    parent[k] = v;
});
s.d('cp', (oldPath, newPath) => {
    const { node, k } = getParentNodeAndKey(oldPath);
    if (!node || !k) {
        s.l(`No node or k. oldPath [${oldPath}]`)
        return;
    }

    let parentNodeAndKey = getParentNodeAndKey(newPath);
    let node2 = parentNodeAndKey.node;
    let k2 = parentNodeAndKey.k;
    if (!node2 || !k2) {
        s.l(`No node2 or k2. newPath [${newPath}]`)
        return;
    }
    node2[k2] = node[k];
    return { node, k };
});
s.d('update', (path, v) => {

    const pathArr = s.pathToArr(path);
    const { parent, k } = s.findParentAndK(pathArr);
    if (!parent || !k) return;

    //todo check operation for Array
    if (k === 'js') {
        eval(v); //use parser or lister for check syntax
        delete parent[sys.sym.FN];
    }
    parent[k] = v;
});
s.d('mv', (oldPath, newPath, sys) => {
    const { node, k } = cp(oldPath, newPath);
    delete node[k];

    //todo rename sysId if necessary
    if (oldPath.length !== 2 || newPath.length !== 2) {
        return;
    }
    if (oldPath[0] === 'net' && s.isStr(oldPath[1]) &&
        newPath[0] === 'net' && s.isStr(newPath[1]) &&
        sys.netId && sys.netId === oldPath[1]
    ) {
        sys.netId = newPath[1];
    }
});
s.d('rm', path => {
    const { node, k } = s.findParentAndK(path);
    if (!node || !k) return;
    delete node[k];
    if (k === 'js') delete node[sys.sym.FN];
});
s.d('merge', (o1, o2) => {

    for (let k in o2) {
        const v1 = o1[k];
        const v2 = o2[k];

        if (typeof v1 === 'object' && typeof v2 === 'object') {

            if (Array.isArray(v1) && Array.isArray(v2)) {
                o1[k] = o2[k];
                continue;
            }
            if (v1 === null || v2 === null) {
                o1[k] = o2[k];
                continue;
            }
            s.merge(v1, v2);
            continue;
        }
        o1[k] = o2[k];
    }
});

if (!s.loop) {
    s.def('loop', {
        file: 'index.js',
        delay: 2000,
        isWorking: false,
        start: async function () {
            this.isWorking = true;
            while (1) {
                await new Promise(r => setTimeout(r, this.delay));
                try {
                    if (!this.isWorking) break;
                    const js = await s.nodeFS.readFile(this.file, 'utf8');
                    eval(js);
                    s.def('js', js);
                }
                catch (e) { console.log(e); }
            }
        },
        stop: function () { } //connect this to elements btn and API
    });
    s.process.on('uncaughtException', e => console.log('[[uncaughtException]]', e.stack));
}
//if (!s.loop.isWorking) s.loop.start();

//if (sys.netId.get() && !s.net[sys.netId]) {
//s.net[sys.netId] = {};
//s.defObjectProp(s.net[sys.netId], 'token', sys.getRandStr(27));
//await s.cpToDisc('net', null, { each: 'token' });
//}
// if (s.f('sys.isEmptyObject', s.users) && await sys.isEmptyDir('state/users', ['.gitignore'])) {
//     await s.cpFromDisc('users.root', 'json', { one: '_sys_.password' });
//     if (!s.users.root) {
//         s.users.root = { _sys_: {} };
//         s.defObjectProp(s.users.root._sys_, 'password', sys.getRandStr(25));
//         await s.cpToDisc('users.root', null, { one: '_sys_.password' });
//     }
// }
//if (!sys.netUpdateIds) s.defObjectProp(sys, 'netUpdateIds', new Map);


// sys.promiseCreate = async (f, timeoutSeconds = 7) => {
//
//   return new Promise((res, rej) => {
//
//     (async () => {
//       let timeout = setTimeout(() => {
//         rej({ err: 'promise timeout', f: f.toString() });
//       }, timeoutSeconds * 1000);
//       await f();
//       clearTimeout(timeout);
//       res();
//     })();
//   });
// }

if (s.onceDB === undefined) s.def('onceDB', 0);
s.def('once', id => {
    if (s.onceDB !== id) {
        s.onceDB = id;
        return true;
    }
    return false;
});
s.def('syncJsScripts', async (node, path) => {

    const isScriptsDirExists = await s.fsAccess('scripts');
    if (!isScriptsDirExists) return;

    const iterate = async (obj, kPath = '') => {

        if (Array.isArray(obj)) return;
        for (let k in obj) {

            const v = obj[k]; const vType = typeof v;
            if (vType === 'object') {
                await iterate(v, kPath ? (kPath + '.' + k) : k);

            } else if (vType === 'string' && k === 'js' && v) {

                if (kPath) await s.nodeFS.writeFile(`scripts/${kPath}.js`, v);
            }
        }
    }
    await iterate(node, path);

    const list = await s.nodeFS.readdir('scripts');
    for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const id = file.slice(0, -3);
        const node = s.find(id);
        if (!node) {
            s.l('delete', id);
            //await s.nodeFS.unlink();
        }
    }
});
sys.syncPath = (path, state) => {
    const currentState = s.find(path);
    for (let k in currentState) {
        if (!state[k]) delete currentState[k];
    }
    //delete what not exists in state
    s.merge(currentState, state);
    //s.l('syncPath', path, Object.keys(state).length);
}

if (sys.logger) {
    s.def('http', new (await s.f('sys.httpClient')));
    s.def('log', new (await s.f('sys.logger')));
    s.def('fs', new (await s.f('sys.fs'))(s.log));
    s.def('os', await s.f('sys.os'));
}

//s.d('processStop', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
//s.def('processRestart', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
//s.d('nodeCrypto', await import('node:crypto'));

sys.getNetToken = () => {
    if (!sys.netId) return;
    if (!s.net[sys.netId]) return;
    return s.net[sys.netId].token;
}
s.defObjectProp(sys, 'getRandStr', (length) => {
    const symbols = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?';
    const str = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = s.nodeCrypto.randomInt(0, symbols.length);
        str.push(symbols.charAt(randomIndex));
    }
    return str.join('');
});
s.defObjectProp(sys, 'isEmptyDir', async (dir, ignore = []) => {
    let list = await s.nodeFS.readdir(dir);
    if (list.length === 0) return true;

    list = list.filter(i => !ignore.includes(i));
    return list.length === 0;
});

// const createServer = async (rqHandler) => {
//   const http = await import('node:http');
//   const server = http.createServer((rq, rs) => rqHandler(rq, rs));
//   return {
//     server,
//     stop: () => {
//       this.server.closeAllConnections();
//       this. server.close(() => this.server.closeAllConnections());
//       console.log('server stop');
//     },
//     restart: () => {
//       // s.server.closeAllConnections();
//       // s.server.close(() => {
//       //   s.l('server stop');
//       //   s.server.closeAllConnections();
//       //   s.server.listen(port, () => s.l(`server start ${port}`));
//       // });
//     }
//   }
// }