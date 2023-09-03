//dynamic dependency change

const deps = {};

class UObject {

  constructor(s, ulid) {
    this.conf = {
      useFS: false,
      createFileWithExtention: false,
    }
    this.s = s;
    this.ulid = ulid;
  }

  setPath(path) {
    this.path = pathFactory(path);
  }

  //move this out of stream
  async createFSPathIfNotExists(path) {

    const fsPath = this.getFSPath(path);

    if (path.length > 1) {
      const fsDir = this.getFSPath(this.path.slice(0, -1));
      const fsDirPath = fsDir.join('/');

      if (!await s.fsAccess(fsDirPath)) {
        await s.nodeFS.mkdir(fsDirPath, { recursive: true });
      }
    }
    if (!await s.fsAccess(fsPath.join('/'))) {
      s.l('create file');
      //await s.nodeFS.writeFile(fsPath, this.serialize());
    }
  }
  //remove format after transfer all to simple files
  async getDataFromFS(fsPathPassed, format = 'json') {
    let fsPath = fsPathPassed;
    if (!fsPath) {
      fsPath = this.getFSPath(this.path);
    }
    const fsPathStr = fsPath.join('/');

    if (!await s.fsAccess(fsPathStr)) return;
    const data = (await s.nodeFS.readFile(fsPathStr, 'utf8')).trim();

    if (format === 'json') {
      return JSON.parse(data);
    }
    return data;
  }
  async setDataToFS(fsPath) {
    this.s.nodeFS.writeFile(fsPath, this.serialize());
  }
  serialize() {
    const data = { type: this.type, v: this.data };
    return JSON.stringify(data);
  }

  async useFS() {
    //create more consistent code logic between createFSPath and getDataFromFS
    //get path

    //const fsPath = this.getFSPath(this.path);

    if (!this.data) {
      //deal with dir
      //GET DATA FROM FS PATH
      const FSData = await this.getDataFromFS();
      if (FSData) {
        this.data = FSData.v;
        this.type = FSData.type;
      }

      //try to LOAD FROM .js
      if (!this.data) {
        //const jsFsPath = [...fsPath];
        //jsFsPath[jsFsPath.length - 1] = jsFsPath[jsFsPath.length - 1] + '.js';
        //const js = await this.getDataFromFS(jsFsPath, 'txt');
        //this.data = js;
        //this.setDataToFS(fsPath);
      }

      //try create with dataDefault
      if (!this.data) {

        if (this.dataDefault) {
          this.data = this.dataDefault;
        } else {
          s.l('No data and no dataDefault, so file not created.');
          return;
        }
      }
    }

    await this.createFSPathIfNotExists(this.path);

    //LISTEN FS PATH
    let fs = s.fsChangesStream(fsPath.join('/'));
    this.internalStreams.fs = fs;
    fs.eventHandler = async e => {
      if (e.eventType !== 'change') return;
      const { v } = await this.getDataFromFS();
      if (v !== this.serialize()) {
        this.set(v);
      }
    }
    fs.start();

    //LISTEN FS PATH WITH EXTENSION
    if (!this.conf.createFileWithExtention) return;

    const fsPathExtension = fsPath + '.' + this.type;
    if (!await s.isPathExistsOnFS(fsPathExtension)) {
      //todo fix this
      await this.createFSPathIfNotExists(fsPathExtension);
      return;
    }
    fs = s.fsChangesStream(fsPathExtension);
    this.internalStreams.fsFileWithExtension = fs;
    fs.eventHandler = async e => {
      if (e.eventType !== 'change') return;
      const { v } = await this.getDataFromFS();
      if (v !== this.data) {
        this.set(v.trim());
        s.l('new value', v);
      }
    }
    fs.start();
  }
  async start() {

    if (this.conf.useFS) await this.useFS();
    else {
      if (!this.data && this.dataDefault) {
        this.data = this.dataDefault;
      }
    }

    //todo REMOVE
    return;

    if (this.data === undefined) {
      s.l('Warning! Data not found and no default data.');
      return;
    }
    s.set(this.path, this);
    this.isWorking = true;
  }
  stop() {
    if (this.conf.useFS) {
      this.internalStreams.fs.stop();
    }
    this.isWorking = false;
  }
  set(v) {
    if (v === undefined) return;
    this.data = v;
    if (!this.isWorking) return;

    // if (this.cong.useFS && source !== 'fs') {
    //     s.nodeFS.writeFile(this.getFSPath(), this.serialize());
    // }
    //trigger all parent and child
  }
  get() { return this.data; }
}

class Relation {}

const pathRelation = path => {

  const pathArr = s.pathToArr(path ? path : '*');
  return {
    arr: pathArr,
    toArr() { return this.arr },
    toDirPath() {
      if (this.arr.length <= 1) return;
      return pathRelation(this.arr.slice(0, -1));
    },
    toFsPath() { return pathRelation(['state', ...this.arr]); },
    toStr() { return this.arr.join('/'); },
  }
}

const factory = (s, ulid) => {

  const objectFactory = async ({ path, type, dataDefault, conf = {} }) => {

    let v;
    const pathRelationObject = pathRelation(path);
    if (path) {
      v = s.find(pathRelationObject.toArr());
    } else {
      v = s;
    }

    if (typeof v === 'object' && v !== null && v[s.sys.sym.TYPE_STREAM]) {
      return v;
    }

    const u = new UObject(s, ulid);
    u[s.sys.sym.TYPE_STREAM] = true;

    u.path = pathRelationObject;
    u.isWorking = false;
    u.type = type;
    u.data = v;
    u.dataDefault = dataDefault;
    //stream.fn = undefined;
    u.conf = conf;
    u.objectsInternal = new Map; //callback, fs, http, ws, ssh and etc.
    u.objectsConnected = new Set;
    await u.start();

    return u;
  };

  return objectFactory;
}

export { factory };
