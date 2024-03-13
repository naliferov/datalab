export const VEditor = {

  setB(b) { this.b = b; },
  set_(_) { this._ = _; },

  //key of map, or simple value
  async open(id, v) {

    const _ = this._;
    const simpleT = new Set(['undefined', 'boolean', 'number', 'bigint', 'string']);
    const p = async (event, data) => await this.b.p(event, data);
    const add = async (data, parent) => {
      const o = await p('doc.mk', data);
      parent.appendChild(o);
      return o;
    }

    this.o = await p('doc.mk', { class: 'vEditor', style: { border: '1px solid black' } });
  },
}