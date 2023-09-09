export class Var {

  constructor() {
    this.updateCallback = null;
  }

  async setValue(value) {
    this.value = value;
    if (this.updateCallback) {
      await this.updateCallback();
    }
  }

  getVarIdByName(name) {
    return this.vars ? this.vars[name] : undefined;
  }

  async setVar(name, id) {
    if (!this.vars) this.vars = {};
    this.vars[name] = id;
    if (this.updateCallback) {
      await this.updateCallback();
    }
  }
  //deleteVar

  onUpdate(fn) {
    this.updateCallback = fn;
  }
}