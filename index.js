//import { Var, VarMeta, VarRelation } from "./src/domain/var.js";
import { varcraftData } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";

let root = await fs.readFile('./state/var/root');
root = root.toString();

const varcraftConcrete = {
  'var.set': async (arg) => {
    if (!arg[1]) return;
    //const v = await varRepository.find({ path: arg[1] });
    //if (v) await v.setData(arg[2]);

    //await this.varStorage.set(v.id, v);

    //v.relativeVarName
    //     if (!p.get(name)) {
    //         p.set(name, u.id);
    //     }

    console.log('...');
  },
  'var.get': async (repository, path) => {
    const vData = await repository.get(path);
    if (!vData) return;

    const v = new Var;
    v.id = vData.id;
    //v.meta = vData.id;

    //search for var relations


    // const r = {id: v.id}
    // if (v.data) r.data = v.data;
    // if (v.vars) {
    //   const getVars = async (vars) => {
    //     const vData = {};
    //
    //     for (let prop in vars) {
    //       if (!vData[prop]) vData[prop] = {};
    //
    //       const rawData = await varStorage.get(vars[prop]);
    //       if (rawData.data && rawData.vars) {
    //         vData[prop].data = rawData.data;
    //         vData[prop].vars = await getVars(rawData.vars);
    //
    //       } else if (rawData.data) {
    //         vData[prop] = rawData.data;
    //       } else if (rawData.vars) {
    //         vData[prop] = await getVars(rawData.vars);
    //       }
    //     }
    //     return vData;
    //   }
    //
    //   r.vars = await getVars(v.vars);
    // }
    return r;
  },
  'getRaw': async (path) => await varRepository.find(path),
  'del': async (arg) => {
    if (!arg[1]) return;
    const v = await varRepository.find({ path: arg[1] });
    const name = arg[1].split('.').at(-1);

    //todo if not found create var with varFactory

    //if (!v.relativeVarName || !v.relativeVarName) return;
    //p.del(name);
    //await this.varStorage.del(v.id);

    //if (v && name) await varRepository.delete(v, name);
  },
  serverStart: (server) => {
    //if (s.server) s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
  },
}

const cmd = {};
for (const method in varcraftData.methods) {
  if (!varcraftConcrete[method]) continue;
  cmd[method] = varcraftConcrete[method];
}

const pathToArr = path => Array.isArray(path) ? path : path.split('.');

const { VarStorage } = await import('./src/storage/varStorage.js');
const varStorage = new VarStorage(fs);

const { Var } = await import('./src/domain/var.js');
const varRoot = Object.create(Var);
varRoot.id = 'root';

// let varRootData = await varStorage.get('root');
// if (varRootData) {
//   if (varRootData.vars) varRoot.vars = varRootData.vars;
// } else {
//   await varStorage.set(varRoot.id, varRoot);
// }

let varRepository;
const {ulid} = await import('ulid');

const { VarRepository } = await import('./src/varRepository.js');
varRepository = new VarRepository(ulid, varRoot, varStorage);

//if (!s.connectedSSERequests) s.def('connectedSSERequests', new Map);

const cliCmdMap = {
  'var.get': async (arg) => {
    return cmdMap['var.get'](pathToArr(arg[1]));
  },
  'var.set': (arg) => {
    return 'cmd test';
  },
  'var.del': (arg) => {
    return 'cmd test';
  }
}

const runCliCmd = async () => {
  const process = (await import('node:process')).default;
  const cliArgs = parseCliArgs(process.argv);
  if (!cliCmdMap[cliArgs[0]]) {
    return;
  }

  const response = await cliCmdMap[cliArgs[0]](cliArgs);
  if (response) {
    console.log(response);
  }
}

await runCliCmd();