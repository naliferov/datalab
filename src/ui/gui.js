import {View} from "./elements/view.js";
import {CodeJar} from 'https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.min.js';
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

(async () => {
    const r = await rq({cmd: 'var.get', path: 'frontend'});

    console.log(r);
    return;

    for (let blockName in r.vars) {
        const block = r.vars[blockName];

        const div = new View;
        app.insert(div);
        const divTxt = new View;
        divTxt.toggleEdit();

        for (let prop in block) {
            if (prop === 'txt') {
                div.insert(divTxt);
                divTxt.setTxt(block[prop]);

                try { eval(block[prop]); }
                catch (e) { console.error(e); }
                continue;
            }
            div.setStyles({[prop]: block[prop]});
        }

        let txt = divTxt.getTxt();
        divTxt.on('keyup', async () => {
            if (divTxt.getTxt() === txt) return;
            txt = divTxt.getTxt();
            await rq({
                cmd: 'var.set',
                path: `frontend.${blockName}.txt`,
                value: txt
            });
        });
    }
})();