const rq = async (data) => {
    const r = await fetch('/', {
        headers: {'content-type': 'application/json'},
        method: 'POST',
        body: JSON.stringify(data)
    });
    return await r.json();
}

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

//script editor in reactangle
//modifier

(async () => {
    const r = await rq({cmd: 'var.get', path: 'frontend'});
    for (let blockName in r.vars) {
        const block = r.vars[blockName];

        const newDiv = document.createElement('div');
        newDiv.contentEditable = true;
        for (let prop in block) {
            if (prop === 'txt') {
                newDiv.innerText = block[prop];
            } else {
                newDiv.style[prop] = block[prop];
            }
        }
        newDiv.addEventListener('keyup', async (e) => {
            const path = `frontend.${blockName}.txt`;
            const value = newDiv.innerText;
            await rq({cmd: 'var.set', path, value});
        });
        app.appendChild(newDiv);
    }
    // for (let prop in r.vars) {
    //     div.style[prop] = r.vars[prop];
    // }
})();