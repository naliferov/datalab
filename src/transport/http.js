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
export const rqHandler = async (x) => {

    const { bus, rq, rs, fs } = x;
    //todo add one time listener to socket
    // rq.socket.on('error', (e) => {
    //     bus.pub('log', { msg: 'rq socker err', e });
    // });

    const ip = rq.socket.remoteAddress;
    const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    const url = new URL('http://t.c' + rq.url);

    rq.pathname = url.pathname;
    rq.mp = `${rq.method}:${url.pathname}`;

    if (x.serveFS && await rqResolveFile(rq, rs, fs)) {
        return;
    }

    const query = rqParseQuery(rq);
    const body = await rqParseBody(rq);
    const msg = body ?? query;

    const event = body.event ?? 'default';

    if (!isLocal && event !== 'var.get' && event !== 'default') {
        rqResponse(rs,'Forbidden');
        return;
    }

    const out = await bus.p('transport',{ b: bus, event, msg });
    if (!out) {
        rqResponse(rs,'Default response');
        return;
    }

    if (typeof out === 'object' && out.msg && out.type) {
        const { msg, type } = out;
        rqResponse(rs, msg, type);
        return;
    }
    rqResponse(rs, out);
};

export class HttpClient {

    constructor(baseURL = '', headers = {}, options = {}) {

        this.headers = headers;
        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/json';
        }
        if (baseURL) this.baseURL = baseURL;
    }

    async rq(method, url, params, headers, options = {}) {
        let timeoutId;
        const controller = new AbortController();
        if (options.timeout) {
            timeoutId = setTimeout(() => controller.abort(), options.timeout);
        }
        if (!headers['Content-Type']) {
            if (params instanceof ArrayBuffer) {
                headers['Content-Type'] = 'application/octet-stream';
            } else {
                headers['Content-Type'] = 'application/json';
            }
        }

        const fetchParams = {method, headers, signal: controller.signal};

        if (method === 'POST' || method === 'PUT') {
            if (params instanceof ArrayBuffer) {
                fetchParams.body = params;
            } else {
                fetchParams.body = headers['Content-Type'] === 'application/json' ? JSON.stringify(params) : this.strParams(params);
            }
        } else {
            if (Object.keys(params).length) url += '?' + new URLSearchParams(params);
        }

        const response = await fetch(this.baseURL ? this.baseURL + url : url, fetchParams);
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }

        let r = {
            statusCode: response.status,
            headers: response.headers
        };
        if (options.blob) {
            r.data = await response.blob();
        } else {
            const contentType = response.headers.get('content-type') ?? '';
            r.data = contentType.startsWith('application/json') ? await response.json() : await response.text();
        }
        return r;
    }

    async get(url, params = {}, headers = {}, options = {}) { return await this.rq('GET', url, params, headers, options); }
    async post(url, params = {}, headers = {}, options = {}) { return await this.rq('POST', url, params, headers, options); }
    async postBuf(url, buffer, query, headers = {}) {
        if (query) url += '?' + new URLSearchParams(query);
        headers['Content-Type'] = 'application/octet-stream';

        return await this.rq('POST', url, buffer, headers);
    }
    async delete(url, params = {}, headers = {}, options = {}) { return await this.rq('DELETE', url, params, headers, options); }
    strParams(params) {
        let str = '';
        for (let k in params) str = str + k + '=' + params[k] + '&';
        return str.length ? str.slice(0, -1) : '';
    }
    async getFile(url, fName) {
        const fs = new (await s.f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'));
        const r = await fetch(url);
        await fs.writeFile(fName, Buffer.from(await r.arrayBuffer()));
    }
}