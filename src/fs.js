const useFS = async () => {

    if (!this.data) {
        //deal with dir
        const FSData = await this.getDataFromFS();
        if (FSData) {
            this.data = FSData.v;
            this.type = FSData.type;
        }
        //try to LOAD FROM .js
        //try to create with dataDefault
        if (this.data) return;

        if (this.dataDefault) {
            this.data = this.dataDefault;
        } else {
            console.log('No data and no dataDefault, so file not created.');
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

//move this out of object
const createFSPathIfNotExists = async (path) => {

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
const getDataFromFS = async (fsPathPassed, format = 'json') => {
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
const setDataToFS = async (fsPath) => {
    await this.s.nodeFS.writeFile(fsPath, this.serialize());
}