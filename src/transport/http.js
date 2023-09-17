const rqParseQuery = (rq) => {
    const query = {};
    const url = new URL('http://t.c' + rq.url);
    url.searchParams.forEach((v, k) => {
        query[k] = v
    });
    return query;
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
const rqGetCookies = rq => {
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
const rqAuthenticate = (rq) => {
    let { token } = sys.rqGetCookies(rq);
    const netToken = sys.getNetToken();
    return token && netToken && token === netToken;
}
const rqResponse = (rs, v, contentType) => {
    const send = (value, type) => rs.writeHead(200, { 'Content-Type': type }).end(value);

    if (!v) {
        send('empty val', 'text/plain; charset=utf-8');
        return;
    }

    if (v instanceof Buffer) {
        send(v, '');
    } else if (typeof v === 'object') {
        send(JSON.stringify(v), 'application/json');
    } else if (typeof v === 'string' || typeof v === 'number') {
        send(v, contentType ?? 'text/plain; charset=utf-8');
    } else {
        send('', 'text/plain');
    }
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
        rqResponse(rs, await cmdMap.get(['', body.path]));
        return;
    }
    if (body.cmd === 'var.set') {
        await cmdMap.set(['', body.path, body.value]);
        rqResponse(rs, {ok: 1}, );
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
    rqResponse(rs, html, 'text/html; charset=utf-8');
    // if (!rq.isLongRequest && !rs.writableEnded) {
    //   rs.s('Default response.');
    // }
};