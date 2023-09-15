export class Var {
  id;
  name;
  data;
  vars;
  rels;

  parentId;
  parentVar;

  constructor() {
    //this.updateCallback = () => {};
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

  async del(name) {
    if (!this.vars) return;
    delete this.vars[name];
    await this.updateCallback();
  }

  sub(fn) {
    this.updateCallback = fn;
  }
}