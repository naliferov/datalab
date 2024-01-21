export const DataEditor = {

  setB(b) { this.b = b; },
  set_(_) { this._ = _; },

  async createStyle() {

    const css = `
.inline { display: inline; }
.container {
    padding: 10px;
    color: rgb(55, 53, 47);
}
.header {
    font-weight: bold;
    font-size: 18px;
    margin-bottom: 8px;
}
.menu {
    position: absolute;
    background: lightgray;
    min-width: 100px;
}
.menuBtn {
    cursor: pointer;
    padding: 1px 7px;
    white-space: nowrap;
}
.menuBtn:hover {
    background: #ababab;
}

div[contenteditable="true"] {
    outline: none;
}
.row {
    margin-left: 16px;
}

.key {
    cursor: pointer;
    border: 1px solid transparent;
    display: inline;
    font-weight: bold;
}
.val {
    cursor: pointer;
    border: 1px solid transparent;
}

.key.mark,
.val.mark {
    background: lightblue;
}
.key[contenteditable="true"],
.val[contenteditable="true"]
 {
    cursor: inherit;
    border: 1px solid rgb(148 148 148);
}
`;
    return await this.b.p('doc.mk', { type: 'style', txt: css });
  },

  async init(path) {

    const _ = this._;

    const rendM = async (o, parentRow) => {

      if (!o.m) return;
      if (!o.o) { console.error('No order array for map', o[_].id, o); return; }

      for (let k of o.o) {
        if (!o.m[k]) { console.error(`Warning key [${k}] not found in map`, o); return; }

        const v = o.m[k];
        if (!v[_]) { console.log('2: Unknown type of VAR', v); return; }

        const row = await this.mkRow({ k, v, parentId: o[_].id, id: v[_].id });
        this.rowInterface(parentRow).val.append(row);
        await rend(v, row);
      }
    }
    const rendL = async (o, parentRow) => {
      if (!o.l) return;

      for (let v of o.l) {
        if (!v[_]) { console.log('2: Unknown type of VAR', v); return; }

        const row = await this.mkRow({ v, parentId: o[_].id, id: v[_].id });
        this.rowInterface(parentRow).val.append(row);
        await rend(v, row);
      }
    }
    const rend = async (v, parentRow) => {
      if (!v[_]) {
        console.log('Unknown VAR', o);
        return;
      }

      if (v.m) await rendM(v, parentRow, v[_].id);
      else if (v.l) await rendL(v, parentRow, v[_].id);
      else if (v.v) {}
      else console.log('Unknown type of var', v);
    }

    const p = async (event, data) => await this.b.p(event, data);
    this.o = await p('doc.mk', { class: 'dataEditor' });

    this.oShadow = this.o.attachShadow({ mode: 'open' });
    this.oShadow.append(await this.createStyle());
    this.oShadow.addEventListener('contextmenu', (e) => this.handleContextmenu(e));

    const container = await p('doc.mk', { class: 'container' });
    this.oShadow.append(container);
    this.container = container;

    const header = await p('doc.mk', { class: 'header', txt: 'Data Editor' });
    container.append(header);

    const root = await this.mkRow({ k: 'root', v: { m: {} }, id: 'root' });
    container.append(root);

    const data = await p('get', { path, depth: 5 });
    await rend(data, root);
  },
  async mkRow(x) {
    const { k, v, parentId, id } = x;

    const r = await this.b.p('doc.mk', { class: 'row' });
    if (id) r.setAttribute('_id', id);
    if (parentId) r.setAttribute('_parent_id', parentId);

    if (v) {
      if (v.l) r.setAttribute('t', 'l');
      if (v.m) r.setAttribute('t', 'm');
      if (v.v) r.setAttribute('t', 'v');
    }
    if (k) {
      r.append(await this.b.p('doc.mk', { txt: k, class: 'key' }));
      r.append(await this.b.p('doc.mk', { txt: ': ', class: ['sep', 'inline'] }));
    }

    const val = await this.b.p('doc.mk', { class: 'val' });
    r.append(val);

    if (v && v.v) {
      let txt = v.v;
      if (txt && txt.split) txt = txt.split('\n')[0];
      val.classList.add('inline');
      val.innerText = txt;
    }

    return r;
  },
  rowInterface(row) {
    const children = row.children;

    const o = {
      row,
      getId() { return this.row.getAttribute('_id') },
      getType() { return this.row.getAttribute('t') },
    }

    if (children.length === 1) {
      o.val = children[0];
    } else {
      o.key = children[0];
      o.val = children[2];
    }
    return o;
  },
  getOrderKey(item, type) {

    const rows = item.parentNode.parentNode.children;
    for (let i = 0; i < rows.length; i++) {

      let element;
      if (type === 'm') element = this.rowInterface(rows[i]).key;
      else if (type === 'l') element = this.rowInterface(rows[i]).val;

      if (element && this.isMarked(element)) {
        return i;
      }
    }
  },
  isRoot(t) { return t.getAttribute('vid') === 'root' },
  isKey(t) { return t.classList.contains('key'); },
  isVal(t) { return t.classList.contains('val'); },
  mark() {
    if (this.marked) this.marked.classList.add('mark');
  },
  unmark() {
    if (this.marked) this.marked.classList.remove('mark');
  },
  remark(t) {
    this.unmark();
    t.classList.add('mark');
    this.marked = t;
  },
  isMarked(t) {
    return t.classList.contains('mark');
  },
  click(e) {
    const path = e.composedPath();
    const t = path[0];
    const classList = t.classList;

    if (this.menu) {
      if (!path.includes(this.menu)) {
        this.menu.remove();
        this.unmark();
      }
    } else {
      this.unmark();
    }

    if (!classList.contains('x1') && !classList.contains('val')) return;
    if (this.isRoot(t)) return;

    e.preventDefault();
    this.remark(t);
  },
  async keydown(e) {

    if (e.key === 'Escape') {
      if (this.marked.innerText !== this.markedTxt) this.marked.innerText = this.markedTxt;
      this.marked.removeAttribute('contenteditable');
      this.mark();
      return;
    }
    if (e.key !== 'Enter' || !this.marked) return;
    e.preventDefault();

    const isEnabled = this.marked.getAttribute('contenteditable') === 'true';
    if (isEnabled) {
      this.marked.removeAttribute('contenteditable');
      this.mark();

      const v = this.marked.innerText;
      if (v === this.markedTxt) return;
      if (!v) { alert('No value is set.'); return; }

      const isKey = this.isKey(this.marked);
      const isVal = this.isVal(this.marked);

      if (isKey) {
        const parentId = this.marked.getAttribute('parent_vid');
        const resp = await this.b.p('cp', { id: parentId, oldKey: this.markedTxt, newKey: v });
        console.log(resp);
      } else if (isVal) {
        const id = this.marked.getAttribute('vid');
        if (id === 'vid_stub') return;
        await this.b.p('set', { id, v: { v } });
      }

      return;
    }

    this.unmark();
    this.marked.setAttribute('contenteditable', 'true');
    this.marked.focus();
    this.markedTxt = this.marked.innerText;
  },
  async handleContextmenu(e) {
    e.preventDefault();
    const t = e.target;

    const isKey = t.classList.contains('key');
    const isV = t.classList.contains('val');
    if (!isKey && !isV) return;

    this.remark(t);

    const p = async (event, data) => await this.b.p(event, data);
    const mkBtn = async (txt, fn) => await p('doc.mk', {txt, class: 'menuBtn', events: {click: fn}});

    const containerSize = await p('doc.getSize', {o: this.container});
    const menu = await p('doc.mk', {
      class: 'menu', css: {
        left: (e.clientX - containerSize.x) + 'px',
        top: (e.clientY - containerSize.y) + 'px',
        padding: '5px',
      }
    });
    if (this.menu) this.menu.remove();
    this.menu = menu;
    this.container.append(menu);

    //todo expand, collapse, structural stream;
    let btn = await mkBtn('Open', (e) => console.log(e));
    btn = await mkBtn('Add', async (e) => {

      const mark = this.marked;
      if (!mark) return;
      if (!this.isKey(mark) && !this.isVal(mark)) return;

      const row = this.rowInterface(mark.parentNode);
      const id = row.getId();
      const v = { v: 'newVal' };
      const type = row.getType();

      if (type === 'm') {
        const k = 'newKey';
        const ok = row.val.children.length;
        const newRow = await this.mkRow({ k, v, id: 'vid_stub', parentId: id });
        row.val.append(newRow);

        const resp = await p('set', { type: 'm', id, k, ok, v });
        console.log(resp);
        if (resp.newId) newRow.setAttribute('_id', resp.newId);
      }

      if (type === 'l') {
        const newRow = await this.mkRow({ v, id: 'vid_stub', parentId: id });
        row.val.append(newRow);

        const resp = await p('set', { type: 'l', id, v });
        console.log(resp);
        if (resp.newId) newRow.setAttribute('vid', resp.newId);
      }

      this.menu.remove();
    });
    this.menu.append(btn);


    if (this.isRoot(t)) return;

    const mv = async (dir) => {

      let parentId, k, row = this.marked.parentNode;

      if (!this.isKey(this.marked) && !this.isVal(this.marked)) {
        return;
      }
      if (dir === 'up' && !row.previousSibling) return;
      if (dir === 'down' && !row.nextSibling) return;

      if (this.isKey(this.marked)) {

        const key = this.marked;
        const row = key.parentNode;
        parentId = row.getAttribute('_parent_id');
        k = this.getOrderKey(key, 'm');

      } else if (this.isVal(this.marked)) {

        const parentRowInterface = this.rowInterface(row.parentNode.parentNode);
        if (parentRowInterface.getType() !== 'l') return;

        parentId = row.getAttribute('_parent_id');
        k = this.getOrderKey(this.marked, 'l');
      }

      if (parentId === undefined) { console.log('parentId is empty'); return; }
      if (k === undefined) { console.log('ok not found'); return; }

      const ok = { from: k, to: dir === 'up' ? --k : ++k };
      const v = await this.b.p('set', {id: parentId, ok});
      console.log(v);
    }
    btn = await mkBtn('Move up', async (e) => await mv('up'));
    this.menu.append(btn);
    btn = await mkBtn('Move down', async (e) => await mv('down'));
    this.menu.append(btn);

    btn = await mkBtn('Copy', (e) => {
      const x1 = this.marked;
      if (!this.isKey(x1)) return;

      const parentId = x1.getAttribute('parent_vid');
      const key = x1.innerText;
      this.buffer = { id: parentId, key, row: x1.parentNode };
      this.menu.remove();
    });
    this.menu.append(btn);

    if (this.buffer) {
      btn = await mkBtn('Paste', async (e) => {
        const x1 = this.marked;
        if (!this.isKey(x1)) return;

        const xx = this.rowInterface(x1.parentNode);
        // if (this.isVal(xx.x2)) {
        //   this.menu.remove();
        //   return;
        // }
        //can't paste to value objects
        return;

        const resp = await this.b.p('cp', {
          oldId: this.buffer.id,
          newId: x1.getAttribute('vid'),
          key: this.buffer.key,
        });
        console.log(resp);

        xx.x2.append(this.buffer.row);
        this.buffer = null;
        this.menu.remove();
      });
      this.menu.append(btn);
    }


    btn = await mkBtn('Convert to map', async (e) => {
      const vid = this.marked.getAttribute('vid');
      const v = await this.b.p('set', {id: vid, v: {m: {}, o: []}});
      console.log(v);
    });
    this.menu.append(btn);
    btn = await mkBtn('Convert to val', (e) => console.log(e));
    this.menu.append(btn);

    btn = await mkBtn('Remove', async (e) => {
      const marked = this.marked;
      if (!marked) return;
      this.menu.remove();

      let row, k, ok;

      if (this.isKey(marked)) {
        row = marked.parentNode;
        k = marked.innerText;
        ok = this.getOrderKey(marked, 'm'); //todo this need to be found automatically on backend
        if (ok === undefined) { console.log('ok not found'); return; }

      } else if (this.isVal(marked)) {
        row = marked.parentNode;
        k = row.getAttribute('_id');
      }

      const parentId = row.getAttribute('_parent_id');
      if (!parentId || !k) return;

      const v = await this.b.p('del', { id: parentId, k, ok }); console.log(v);
      marked.parentNode.remove();
    });
    this.menu.append(btn);
  }

  // async duplicate(outlinerNode) {
  //
  //     const parentDataNode = outlinerNode.getParent().getDataNode();
  //     const dataNode = outlinerNode.getDataNode();
  //     const newK = dataNode.getKey() + '_copy';
  //
  //     if (parentDataNode.get(newK)) {
  //         console.log(`Key ${newK} already exists in object.`); return;
  //     }
  //     let v = dataNode.getData();
  //     if (s.f('sys.isObject', v) || s.f('sys.isArray', v)) v = structuredClone(v);
  //
  //     const newDataNode = new this.node(v);
  //     newDataNode.setKey(newK);
  //     const newOutlinerNode = new this.outlinerNode;
  //     await newOutlinerNode.init(newDataNode, false, this);
  //
  //     e('>after', [newOutlinerNode.getV(), outlinerNode.getV()]);
  //     this.nodes.set(newOutlinerNode.getDomId(), newOutlinerNode);
  //
  //     parentDataNode.set(newK, v);
  //     setTimeout(() => newOutlinerNode.focus(), 100);
  //
  //     newDataNode.setPath(newOutlinerNode.getPath());
  //     s.e('state.update', { dataNode: newDataNode, data: v });
  // }
}