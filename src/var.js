export class Var {
  id;
  name;
  data;
  vars;
  rels;

  relativeVarId;
  relativeVarName;

  async setData(data) {
    this.data = data;
  }
  async set(name, id) {
    if (!this.vars) this.vars = {};
    this.vars[name] = id;
  }
  get(name) {
    return this.vars ? this.vars[name] : undefined;
  }
  async del(name) {
    if (!this.vars) return;
    delete this.vars[name];
  }
}