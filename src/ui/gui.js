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

const frontend = await rq({ cmd: 'var.get', path: ['frontend'], depth: 3 });
console.log(frontend);

for (let name in frontend) {

    if (name === 'mainDiv') continue;

    const block = frontend[name];

    const div = new View;
    app.insert(div);

    for (let prop in block) {
        if (prop === 'txt') {
            const txt = new View;
            div.insert(txt);
            txt.setTxt(block[prop].data);
            continue;
        }
        div.setStyles({ [prop]: block[prop].data });
    }

    //     await rq({
    //         cmd: 'var.set',
    //         path: `frontend.${blockName}.txt`,
    //         value: txt
    //     });
}
