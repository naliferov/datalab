const trigger = async () => {
    console.log('ONCE', new Date);

    //await s.subPath('scripts', );
    //controll of watchers from declarativeUI

    if (s.scriptsSub) {
        //s.def('scriptsSub', await s.subPath('scripts'));
        //s.scriptsWatcher.start();
    }
    if (s.scriptsWatcher) {
        //await s.syncJsScripts(sys, 'sys');
        s.scriptsWatcher.slicer = async (e) => {
            if (e.eventType !== 'change') return;

            const id = e.filename.slice(0, -3);
            const node = s.find(id);
            if (!node) return;

            const tNode = typeof node;
            console.log('updateFromFS', e.filename);
            const js = await s.nodeFS.readFile('scripts/' + e.filename, 'utf8');
            if (js === node.js) {
                console.log('js already updated');
                return;
            }
            try {
                eval(js);
                if (tNode === 'object') node.js = js;
                delete node[sys.sym.FN];

                //for detect path use scriptsDirExists
                await s.cpToDisc('sys');

            } catch (e) { s.log.error(e.toString(), e.stack); }
        }
    }

    //const netId = await s.fsAccess('state/sys/netId.txt');
    //if (netId && !s.scriptsWatcher && sys.fsChangesSlicer) {
    //s.def('scriptsWatcher', await s.f('sys.fsChangesSlicer', 'scripts'));
    //s.scriptsWatcher.start();
    //}

}
s.def('trigger', async () => await trigger());


//const netCmds = s.net[sys.netId].cmds;
//if (!netCmds) return;

// for (let i in netCmds) {
//
//   const conf = netCmds[i];
//   if (conf.cmd && conf.isEnabled) {
//     const f = eval(`async () => { ${conf.cmd} }`);
//
//     if (!conf.promise) {
//       try {
//         conf.promise = sys.promiseCreate(f);
//         await conf.promise;
//       } catch (e) {
//         s.l(e);
//       } finally {
//         delete conf.promise;
//       }
//     }
//
//   }
// }