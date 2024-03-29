export class storage {

  constructor(path, b) {
    this.path = path;
    this.b = b;
  }
  getStatePath() { return this.path; }

  async set(id, v, format = 'json') {
    const path = `${this.path}/${id}`;

    this.b.p('storage', { set: { id, path, v, format } });
  }
  async get(id, format = 'json') {
    const path = `${this.path}/${id}`;

    return this.b.p('storage', { get: { id, path, format } });
  }
  async del(id) {
    const path = `${this.path}/${id}`;

    return this.b.p('storage', { del: { id, path } });
  }
}