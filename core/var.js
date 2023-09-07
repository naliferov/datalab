export class Var {

  constructor() {
    this.subscribers = [];
  }
  setData(data) {}
  onDataChange(fn) {
    this.subscribers.push(fn);
  }
}