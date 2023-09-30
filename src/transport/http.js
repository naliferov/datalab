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
                resolve({ err: `limit reached [${limitMb} mb]` });
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
const rqResolveFile = async (rq, rs, fs) => {

    const lastPart = rq.pathname.split('/').pop();
    const split = lastPart.split('.');
    if (split.length < 2) return false;

    const extension = split[split.length - 1]; if (!extension) return;
    try {
        const m = { html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' };
        if (m[extension]) rs.setHeader('Content-Type', m[extension]);

        rs.end(await fs.readFile('.' + rq.pathname));
        return true;
    } catch (e) {
        console.log(e);
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
    const send = (value, type) => {
        rs.writeHead(200, { 'Content-Type': type }).end(value);
    }

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
export const rqHandler = async (rq, rs, conf) => {

    const ip = rq.socket.remoteAddress;
    const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    const url = new URL('http://t.c' + rq.url);
    rq.pathname = url.pathname;
    rq.mp = `${rq.method}:${url.pathname}`;

    if (conf.serveFiles && await rqResolveFile(rq, rs, conf.fs)) {
        return;
    }

    const query = rqParseQuery(rq);
    const body = await rqParseBody(rq);
    const msg = body ?? query;

    const cmd = body.cmd;
    const fn = conf.cmdMap[cmd] || conf.cmdMap['default'];

    if (!isLocal && cmd !== 'var.get') {
        rqResponse(rs,'Forbidden.');
        return;
    }

    const out = await fn({ msg });
    if (!out) return;

    if (typeof out === 'object' && out.msg && out.type) {
        const { msg, type } = out;
        rqResponse(rs, msg, type);
        return;
    }
    rqResponse(rs, out);
};