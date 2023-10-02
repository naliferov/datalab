import { View } from "./frame/view.js";
//import {CodeJar} from 'https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.min.js';
//console.log(CodeJar);

const rq = async (data) => {
    const r = await fetch('/', {
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(data)
    });
    return await r.json();
}

const app = new View({id: 'app'});
document.body.appendChild(app.getDOM());

const frontend = await rq({ cmd: 'var.get', path: ['frontend'], depth: 2 });
console.log(frontend);

for (let name in frontend) {

    const view = frontend[name];

    const div = new View;
    app.insert(div);

    for (let prop in view) {
        // if (prop === 'txt') {
        //     div.insert(divTxt);
        //     divTxt.setTxt(block[prop]);
        //
        //     try { eval(block[prop]); }
        //     catch (e) { console.error(e); }
        //     continue;
        // }
        div.setStyles({ [prop]: view[prop].data });
    }

    // let txt = divTxt.getTxt();
    // divTxt.on('keyup', async () => {
    //     if (divTxt.getTxt() === txt) return;
    //     txt = divTxt.getTxt();
    //     await rq({
    //         cmd: 'var.set',
    //         path: `frontend.${blockName}.txt`,
    //         value: txt
    //     });
    // });
}