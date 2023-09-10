export class Var {

  constructor() {
    this.updateCallback = () => {};
  }

  setParent(parent) {
    this.parent = parent;
  }

  async setData(data) {
    this.data = data;
    await this.updateCallback();
  }

  async set(name, id) {
    if (!this.vars) this.vars = {};
    this.vars[name] = id;
    await this.updateCallback();
  }
  get(name) {
    return this.vars ? this.vars[name] : undefined;
  }
  del() {}

  sub(fn) {
    this.updateCallback = fn;
  }
}