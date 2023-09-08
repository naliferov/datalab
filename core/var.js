export class Var {

  constructor() {
    this.updateCallback = null;
  }
  async setData(data) {
    this.data = data;
    if (this.updateCallback) {
      await this.updateCallback(data);
    }
  }
  onUpdate(fn) {
    this.updateCallback = fn;
  }
}