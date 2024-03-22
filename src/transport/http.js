const getBody = async ({ rq, limitMb = 12, runtime }) => {

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
    rq.on('error', err => {
      rq.destroy();
      reject({ err });
    });
    rq.on('end', () => {
      if (runtime && !runtime.Buffer.concat) { resolve({ err: 'No buffer' }); return; }

      let msg = {};

      msg.bin = runtime.Buffer.concat(b);

      if (rq.headers['content-type'] === 'application/json') {
        try { msg = JSON.parse(b.toString()); }
        catch (e) { msg = { err: 'json parse error', data: b.toString() }; }
      }
      resolve(msg);
    });
  });
}
const resolveFile = async ({ ctx, fs }) => {

  const query = ctx.query;
  let ext, mime;

  if (!query.getFile) { //todo rename to getAsFile

    const lastPart = ctx.url.pathname.split('/').pop();
    const split = lastPart.split('.');

    if (split.length < 2) return {};

    ext = split[split.length - 1];
    if (!ext) return {};

    mime = { html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' }[ext];
  }

  try {
    return { file: await fs.readFile('.' + ctx.url.pathname), mime };
  } catch (e) {
    if (e.code !== 'ENOENT') console.log('Error of resolve file', e);
    return { fileNotFound: true };
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
const set = ({ rs, code = 200, mime, v, runtime }) => {

  const plain = 'text/plain; charset=utf-8';
  const send = (value, typeHeader) => {
    try {
      rs.writeHead(code, { 'Content-Type': typeHeader }).end(value);
    } catch (e) {
      console.log('error sending response');
    }
  }

  if (!v) { send('empty val', plain); return; }

  if (runtime && v instanceof runtime.Buffer) {
    send(v, mime ?? '');
  } else if (typeof v === 'object') {
    send(JSON.stringify(v), 'application/json');
  } else if (typeof v === 'string' || typeof v === 'number') {
    send(v, mime ?? plain);
  } else {
    send('Empty response', plain);
  }
}
export const rqHandler = async (x) => {

  const { b, runtime, rq, rs, fs, serveFS } = x;

  const ctx = {
    headers: rq.headers,
    url: new URL('http://t.c' + rq.url),
    query: {},
    body: {},
  };
  ctx.url.searchParams.forEach((v, k) => ctx.query[k] = v);

  if (runtime === 'node') {
    rq.on('error', (e) => { rq.destroy(); console.log('request no error', e); });
  }
  if (ctx.url.pathname.toLowerCase().includes('state/sys')) {
    set({ rs, code: 403, v: 'Access denied', runtime });
    return;
  }

  if (serveFS) {
    const r = await resolveFile({ ctx, fs });
    if (r.file && r.mime) {
      set({ rs, v: r.file, mime: r.mime, runtime });
      return;
    }
    if (r.fileNotFound) {
      set({ rs, code: 404, v: 'File not found', runtime });
      return;
    }
  }

  const body = await getBody({ rq, runtime });
  let msg = body ?? query;

  if (msg.err) {
    console.log('msg.err', msg.err);
    set({ rs, v: 'error processing rq', runtime });
    return;
  }

  if (msg.bin) {
    if (ctx.headers.x) {
      const x = JSON.parse(ctx.headers.x);
      msg = { bin: msg.bin, ...x };
    } else {
      msg.getHtml = true;
    }
  }

  const o = await b.p('x', msg);
  if (!o) {
    set({ rs, v: 'Default response', runtime });
    return;
  }
  if (o.bin && o.isHtml) {
    const { bin, isHtml } = o;
    set({ rs, v: bin, mime: isHtml ? 'text/html' : null, runtime });
    return;
  }
  set({ rs, v: o, runtime });
};

export class HttpClient {

  constructor(baseURL = '', headers = {}, options = {}) {
    this.headers = headers;
    if (baseURL) this.baseURL = baseURL;
  }

  processHeaders(headers, params) {
    if (!headers['Content-Type']) {
      if (params instanceof ArrayBuffer) {
        headers['Content-Type'] = 'application/octet-stream';
      } else {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  async rq(method, url, params, headers, options = {}) {
    let timeoutId;
    const controller = new AbortController();
    if (options.timeout) {
      timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }

    this.processHeaders(headers, params);

    const fetchParams = { method, headers, signal: controller.signal };

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
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    let r = {
      statusCode: response.status,
      headers: response.headers
    };
    if (options.blob) {
      r.data = await response.blob();
    } else {
      const t = response.headers.get('content-type') ?? '';
      r.data = t.startsWith('application/json') ? await response.json() : await response.text();
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
}