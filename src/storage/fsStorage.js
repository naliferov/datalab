export class FsStorage {

  constructor(path, fs) {
    this.path = path;
    this.fs = fs;
  }
  getStatePath() { return this.path; }

  async set(id, v, format = 'json') {
    const data = format === 'json' ? JSON.stringify(v) : v;
    await this.fs.writeFile(`${this.path}/${id}`, data);
  }
  async get(id, format = 'json') {
    try {
      const data = await this.fs.readFile(`${this.path}/${id}`);
      return format === 'json' ? JSON.parse(data) : data;
    } catch (e) {
      console.log(e.message);
    }
  }
  async del(id) {
    await this.fs.unlink(`${this.path}/${id}`);
  }
}