export class Var {

  constructor() {
    this.updateCallback = null;
  }

  getVarIdByName(name) {
    return this.vars ? this.vars[name] : undefined;
  }

  async setData(data) {
    this.data = data;
    if (this.updateCallback) {
      await this.updateCallback();
    }
  }

  async set(name, id) {
    if (!this.vars) this.vars = {};
    this.vars[name] = id;
    if (this.updateCallback) {
      await this.updateCallback();
    }
  }
  get(name) {}
  del() {

  }
  sub(fn) {
    this.updateCallback = fn;
  }
}