#!/usr/bin/env node

(async () => {
  globalThis.s ??= {};
  s.sys ??= {};
  const sys = s.sys;
  const isBrowser = typeof window !== 'undefined';

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
  s.isObject = d => typeof d === 'object' && !Array.isArray(d) && d !== null;
  s.d('isStr', str => typeof str === 'string');
  s.l = console.log;
  s.pathToArr = path => Array.isArray(path) ? path : path.split('.');
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

  //GLOBAL PUB SUB
  s.defObjectProp(sys, 'eventHandlers', {});
  globalThis.e = new Proxy(() => { }, {
    apply(target, thisArg, args) {
      const handler = args[0];
      const data = args[1];

      if (sys.eventHandlers[handler]) {
        return sys.eventHandlers[handler](data);
      }
    },
    set(target, k, v) {
      sys.eventHandlers[k] = v;
      return true;
    }
  });
  s.d('e', e);

  if (isBrowser) {
    s.d('fetchState', async path => {
      const res = await fetch('/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path.split('.') }),
      });
      return await res.json();
    });

    sys.proxyS = {};
    globalThis.s = new Proxy(s, sys.proxyS);

    //s.l(await s.f('sys.apps.GUI/mainJs'));
    const GUI = new (await s.f('sys.apps.GUI/mainJs'));
    await GUI.start();
    return;
  }
  s.d('parseCliArgs', cliArgs => {
    const args = {};
    let num = 0;

    for (let i = 0; i < cliArgs.length; i++) {
      if (i < 2) continue; //skip node and scriptName args

      let arg = cliArgs[i];
      args[num++] = arg;

      if (arg.includes('=')) {
        let [k, v] = arg.split('=');
        if (!v) {
          args[num] = arg; //start write args from main 0
          continue;
        }
        args[k.trim()] = v.trim();
      } else {
        args['cmd'] = arg;
      }
    }
    return args;
  });

  s.process = (await import('node:process')).default;
  s.d('processStop', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
  //s.def('processRestart', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
  s.d('nodeCrypto', await import('node:crypto'));
  s.nodeFS = (await import('node:fs')).promises;
  s.nodeFS.isExists = async path => {
    try { await s.nodeFS.access(path); return true; }
    catch { return false; }
  }
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


  const { VarStorage } = await import('./src/storage/varStorage.js');
  const varStorage = new VarStorage(s.nodeFS);

  const { Var } = await import('./src/var.js');
  const varRoot = new Var;
  varRoot.id = 'root';

  let varRootData = await varStorage.get('root');
  if (varRootData) {
    if (varRootData.vars) varRoot.vars = varRootData.vars;
  } else {
    await varStorage.set(varRoot.id, varRoot);
  }

  let varFactory;
  if (!s.o) {
    const {ulid} = await import('ulid');

    const { createPathRelationFactory } = await import('./src/pathRelation.js');
    const pathRelationFactory = createPathRelationFactory(s.pathToArr);

    const { VarFactory } = await import('./src/varFactory.js');
    varFactory = new VarFactory(ulid, pathRelationFactory, varRoot, varStorage);
  }

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
      stop: function () { } //connect this to UI btn and API
    });
    s.process.on('uncaughtException', e => console.log('[[uncaughtException]]', e.stack));
  }
  //if (!s.loop.isWorking) s.loop.start();

  if (sys.logger) {
    s.def('http', new (await s.f('sys.httpClient')));
    s.def('log', new (await s.f('sys.logger')));
    s.def('fs', new (await s.f('sys.fs'))(s.log));
    s.def('os', await s.f('sys.os'));
  }

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
  if (!s.connectedSSERequests) s.def('connectedSSERequests', new Map);

  const cliArgs = s.parseCliArgs(s.process.argv);
  const cmdMap = {
    'set': async (arg) => {
      if (!arg[1]) return;
      const v = await varFactory.create({ path: arg[1] });
      if (v) await v.setData(arg[2]);
      console.log('...');
    },
    'get': async (arg) => {
      const path = arg[1];
      if (!path) return;
      const v = await varFactory.create({ path });
      if (!v) return;

      const r = {id: v.id}
      if (v.data) r.data = v.data;
      if (v.vars) {
        const getVars = async (vars) => {
          const vData = {};

          for (let prop in vars) {
            if (!vData[prop]) vData[prop] = {};

            const rawData = await varStorage.get(vars[prop]);
            if (rawData.data && rawData.vars) {
              vData[prop].data = rawData.data;
              vData[prop].vars = await getVars(rawData.vars);

            } else if (rawData.data) {
              vData[prop] = rawData.data;
            } else if (rawData.vars) {
              vData[prop] = await getVars(rawData.vars);
            }
          }
          return vData;
        }

        r.vars = await getVars(v.vars);
      }
      return r;
    },
    'getRaw': async (arg) => {
      console.info(await varFactory.create({ path: arg[1] }));
    },
    'del': async (arg) => {
      if (!arg[1]) return;
      const v = await varFactory.create({ path: arg[1] });
      const name = arg[1].split('.').at(-1);

      if (v && name) await varFactory.delete(v, name);
    },
    'list': (arg) => {
      //s.l(varRoot.list());
    },
    serverStart: () => {
      if (s.server) s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    },
    serverStop: () => {}
  }

  const rqParseBody = async (rq, limitMb = 12) => {

    let limit = limitMb * 1024 * 1024;
    return new Promise((resolve, reject) => {
      let b = [];
      let len = 0;

      rq.on('data', chunk => {
        len += chunk.length;
        if (len > limit) {
          rq.destroy();
          resolve({ err: `limit reached [${limitMb}mb]` });
          return;
        }
        b.push(chunk);
      });
      rq.on('error', err => reject(err));
      rq.on('end', () => {
        b = Buffer.concat(b);

        if (rq.headers['content-type'] === 'application/json') {
          try { b = JSON.parse(b.toString()); }
          catch (e) { b = { err: 'json parse error' }; }
        }
        resolve(b);
      });
    });
  }
  const rqParseQuery = (rq) => {
    const query = {};
    const url = new URL('http://t.c' + rq.url);
    url.searchParams.forEach((v, k) => {
      query[k] = v
    });
    return query;
  }
  const rqResolveStatic = async (rq, rs) => {

    const lastPart = rq.pathname.split('/').pop();
    const split = lastPart.split('.');
    if (split.length < 2) return false;

    const extension = split[split.length - 1]; if (!extension) return;
    try {
      const file = await s.nodeFS.readFile('.' + rq.pathname);
      const m = { html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' };
      if (m[extension]) rs.setHeader('Content-Type', m[extension]);

      rs.end(file);
      return true;
    } catch (e) {
      if (s.log) s.log.info(e.toString(), { path: e.path, syscall: e.syscall });
      else console.log(e);
      return false;
    }
  }
  sys.rqGetCookies = rq => {
    const header = rq.headers.cookie;
    if (!header || header.length < 1) {
      return {};
    }
    const cookies = header.split('; ');
    const result = {};
    for (let i in cookies) {

      const cookie = cookies[i].trim();
      const index = cookie.indexOf('=');
      if (index === -1) continue;

      const k = cookie.slice(0, index);
      const v = cookie.slice(index + 1);

      if (!k || !v) continue;

      result[k.trim()] = v.trim();
    }
    return result;
  }
  sys.rqAuthenticate = (rq) => {
    let { token } = sys.rqGetCookies(rq);
    const netToken = sys.getNetToken();
    return token && netToken && token === netToken;
  }
  sys.rqResponse = (rs, v, contentType) => {
    const s = (value, type) => rs.writeHead(200, { 'Content-Type': type }).end(value);

    if (!v) s('empty val', 'text/plain; charset=utf-8');
    else if (v instanceof Buffer) s(v, '');
    else if (typeof v === 'object') s(JSON.stringify(v), 'application/json');
    else if (typeof v === 'string' || typeof v === 'number') s(v, contentType ?? 'text/plain; charset=utf-8');
    else s('', 'text/plain');
  }

  const rqHandler = async (rq, rs) => {
    const ip = rq.socket.remoteAddress;
    const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    const url = new URL('http://t.c' + rq.url);

    rq.pathname = url.pathname;
    rq.mp = `${rq.method}:${url.pathname}`;
    s.l(ip, rq.mp);

    if (await rqResolveStatic(rq, rs)) return;

    const body = await rqParseBody(rq);
    if (body.cmd === 'var.get') {
      sys.rqResponse(rs, await cmdMap.get(['', body.path]));
      return;
    }
    if (body.cmd === 'var.set') {
      await cmdMap.set(['', body.path, body.value]);
      sys.rqResponse(rs, {ok: 1}, );
      return;
    }
    const html = `
        <!doctype html>
        <html lang=xx>
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
            <title>varcraft</title>
            <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body>
        <style>body { margin: 0; background: whitesmoke; }</style>
        <script type="module" src="/src/frontend/main.js"></script>
        </body>
        </html>
    `;
    sys.rqResponse(rs, html, 'text/html; charset=utf-8');
    // if (!rq.isLongRequest && !rs.writableEnded) {
    //   rs.s('Default response.');
    // }
  };

  if (!s.server) {
    s.nodeHttp = await import('node:http');
    s.def('server', s.nodeHttp.createServer((rq, rs) => rqHandler(rq, rs)));
    s.def('serverStop', () => {
      s.server.closeAllConnections();
      s.server.close(() => s.server.closeAllConnections());
      s.l('server stop');
    });
    s.def('serverRestart', port => {
      s.server.closeAllConnections();
      s.server.close(() => {
        s.l('server stop');
        s.server.closeAllConnections();
        s.server.listen(port, () => s.l(`server start ${port}`));
      });
    });
  }

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

  if (cmdMap[cliArgs[0]]) {
    const response = await cmdMap[cliArgs[0]] (cliArgs);
    if (response) {
      console.log(response);
    }
  }
})();
