export const rqHandler = async (x) => {

  const { b, runtimeCtx, rq, rs, fs } = x;

  const ctx = {
    rq, headers: rq.headers,
    url: new URL('http://t.c' + rq.url),
    query: {}, body: {},
  };
  if (typeof rq.headers.get !== 'function') {
    ctx.headers = { headers: { ...rq.headers }, get(k) { return this.headers[k]; } };
  }
  ctx.url.searchParams.forEach((v, k) => ctx.query[k] = v);

  if (ctx.url.pathname.toLowerCase().includes('state/sys')) {
    return set({ rs, code: 403, v: 'Access denied', runtimeCtx });
  }

  if (fs) {
    const r = await getFile({ ctx, fs });
    if (r.file && r.mime) {
      return set({ rs, v: r.file, mime: r.mime, runtimeCtx });
    }
    if (r.fileNotFound) {
      return set({ rs, code: 404, v: 'File not found', runtimeCtx });
    }
  }

  const body = await getBody({ ctx, runtimeCtx });
  let msg = body ?? query;
  if (msg.err) {
    console.log('msg.err', msg.err);
    return set({ rs, v: 'error processing rq', runtimeCtx });
  }
  if (msg.bin) {
    if (ctx.headers.get('x')) {
      const x = JSON.parse(ctx.headers.x);
      msg = { bin: msg.bin, ...x };
    } else {
      msg.getHtml = true;
    }
  }

  const o = await b.p('x', msg);
  if (!o) {
    return set({ rs, v: 'Default response', runtimeCtx });
  }
  if (o.bin && o.isHtml) {
    const { bin, isHtml } = o;
    const mime = isHtml ? 'text/html' : null;
    return set({ rs, v: bin, mime, runtimeCtx });
  }
  return set({ rs, v: o, runtimeCtx });
};
const getBody = async ({ ctx, runtimeCtx, limitMb = 12 }) => {

  let limit = limitMb * 1024 * 1024;
  const rq = ctx.rq;

  const readAsJson = ctx.headers.get('content-type') === 'application/json';

  if (!rq.on) {
    if (!rq.body) return {};
    // const b = [];
    // let len = 0;
    // for await (const p of rq.body) {
    //   b.push(p);
    //   len += p.length;
    //   if (len > limit) {
    //     return;
    //   }
    // }

    const bin = await rq.arrayBuffer();
    if (readAsJson) {
      return JSON.parse((new TextDecoder('utf-8')).decode(bin));
    }
    return { bin };
  }

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

      if (runtimeCtx && !runtimeCtx.Buffer.concat) { resolve({ err: 'No buffer' }); return; }

      let msg = {};
      msg.bin = runtimeCtx.Buffer.concat(b);

      if (readAsJson) {
        try { msg = JSON.parse(b.toString()); }
        catch (e) { msg = { err: 'json parse error', data: b.toString() }; }
      }
      resolve(msg);
    });
  });
}
const getFile = async ({ ctx, fs }) => {

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
const set = ({ runtimeCtx, rs, code = 200, mime, v }) => {

  const plain = 'text/plain; charset=utf-8';
  const send = (v, typeHeader) => {
    const headers = { 'content-type': typeHeader };
    try {
      if (runtimeCtx.rtName === 'deno' || runtimeCtx.rtName === 'bun') {
        return new runtimeCtx.response(v, { status: code, headers });
      }
      rs.writeHead(code, headers).end(v);
    } catch (e) {
      console.log('error sending response');
    }
  }

  if (runtimeCtx.Buffer && v instanceof runtimeCtx.Buffer) {
    return send(v, mime ?? '');
  }
  if (typeof v === 'object') {
    return send(JSON.stringify(v), 'application/json');
  }
  if (typeof v === 'string' || typeof v === 'number') {
    return send(v, mime ?? plain);
  }
  return send('empty resp', plain);
}

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
  async get(url, params = {}, headers = {}, options = {}) {
    return await this.rq('GET', url, params, headers, options);
  }
  async post(url, params = {}, headers = {}, options = {}) {
    return await this.rq('POST', url, params, headers, options);
  }
  async delete(url, params = {}, headers = {}, options = {}) { return await this.rq('DELETE', url, params, headers, options); }
  strParams(params) {
    let str = '';
    for (let k in params) str = str + k + '=' + params[k] + '&';
    return str.length ? str.slice(0, -1) : '';
  }
}