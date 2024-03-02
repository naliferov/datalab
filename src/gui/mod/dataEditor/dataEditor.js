export const DataEditor = {

  setB(b) { this.b = b; },
  set_(_) { this._ = _; },

  async createStyle() {

    const css = `
.container {
  font-family: 'Roboto', sans-serif;
  margin-top: 15px;
}
.inline { display: inline; }
.hidden { display: none; }
.container {
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

  async getOpenedIds() {
    let ids = await this.b.p('get', { repo: 'idb', id: 'openedIds' });
    if (!ids) ids = new Set();
    return ids;
  },
  async openId(id) {
    const v = await this.getOpenedIds();
    v.add(id);
    await this.b.p('set', { repo: 'idb', id: 'openedIds', v });
  },

  async init() {

    const _ = this._;

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

    const root = await this.mkRow({
      k: 'root',
      v: { m: {}, o: [], i: { id: 'root', t: 'm' } },
      id: 'root'
    });
    container.append(root);


    //open ids of prefiled. this will be alternative of http adress
    const openedIds = await this.getOpenedIds();
    const v = await p('get', { id: 'root', subIds: [...openedIds], depth: 1, getMeta: true });
    console.log(v);
    await this.rend(v, root);
  },

  async rend(v, parentRow) {

    const getVId = v => {
      if (v.i) return v.i.id;
    }
    const id = getVId(v);
    if (!id) { console.log('Unknown VAR', v); return; }

    if (v.m) {

      if (!v.o) { console.error('No order array for map', id, v); return; }

      for (let k of v.o) {
        if (!v.m[k]) { console.error(`Warning key [${k}] not found in map`, o); return; }

        const curV = v.m[k];
        const curVId = getVId(curV);
        if (!curVId) { console.log('2: Unknown type of VAR', curV); return; }

        const row = await this.mkRow({ k, v: curV, parentId: id, id: curVId });
        this.rowInterface(parentRow).val.append(row);
        await this.rend(curV, row);
      }

    } else if (v.l) {

      for (let curV of v.l) {

        const curVId = getVId(curV);
        if (!curVId) { console.log('2: Unknown type of VAR', curV); return; }

        const row = await this.mkRow({ v: curV, parentId: id, id: curVId });
        this.rowInterface(parentRow).val.append(row);
        await this.rend(curV, row);
      }
    }
    else if (v.v) { }
    else if (v.i) { }
    else console.log('Unknown type of var', v);
  },

  async mkRow(x) {
    const { k, v, parentId, id, domId } = x;

    let r;
    if (domId) {
      r = this.container.querySelector('#' + domId);
      if (!r) return;
      r.innerHTML = '';
    } else {
      r = await this.b.p('doc.mk', { class: 'row' });
      r.id = await this.b.p('getUniqForDomId');
    }

    if (id) r.setAttribute('_id', id);
    if (parentId) r.setAttribute('_parent_id', parentId);

    let openCloseBtn = await this.b.p('doc.mk', { txt: '+ ', class: ['openClose', 'hidden', 'inline'] });
    r.append(openCloseBtn);

    if (k) {
      r.append(await this.b.p('doc.mk', { txt: k, class: 'key' }));
      r.append(await this.b.p('doc.mk', { txt: ': ', class: ['sep', 'inline'] }));
    }
    if (v) {
      const t = v.i.t;
      if (t === 'l' || t === 'm') openCloseBtn.classList.remove('hidden');

      if (t) r.setAttribute('t', t);

      if (!v.i.openable) {
        openCloseBtn.innerText = '- ';
        openCloseBtn.classList.add('opened');
      }
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
      dom: row,
      getDomId() { return this.dom.getAttribute('id') },
      getId() { return this.dom.getAttribute('_id') },
      getParentId() { return this.dom.getAttribute('_parent_id') },
      getType() { return this.dom.getAttribute('t') },
      getKeyValue() {
        if (!this.key) return;
        return this.key.innerText;
      },
      clearVal() { this.val.innerHTML = ''; },
      isValHasSubItems() {
        return this.val.children.length > 0;
      }
    }

    o.openCloseBtn = {
      obj: children[0],
      open() {
        this.obj.classList.add('opened');
        this.obj.innerText = '- ';
      },
      close() {
        this.obj.classList.remove('opened');
        this.obj.innerText = '+ ';
      },
      isOpened() {
        return this.obj.classList.contains('opened');
      }
    }

    if (children.length === 2) { //todo better check type
      o.val = children[1];
    } else {
      o.key = children[1];
      o.val = children[3];
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
  isRoot(t) { return t.getAttribute('_id') === 'root' },
  isKey(t) { return t.classList.contains('key'); },
  isVal(t) { return t.classList.contains('val'); },
  isOpenCloseBtn(t) { return t.classList.contains('openClose'); },

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
  async click(e) {
    const path = e.composedPath();
    const t = path[0];
    const classList = t.classList;

    if (this.menu) {
      if (!path.includes(this.menu)) {
        this.menu.remove();
        this.unmark();
      }
    } else this.unmark();

    if (this.isOpenCloseBtn(t)) {
      const row = this.rowInterface(t.parentNode);
      if (row.openCloseBtn.isOpened()) {

        const openedIds = await this.getOpenedIds();
        if (row.getId()) openedIds.delete(row.getId());
        await this.b.p('set', { repo: 'idb', id: 'openedIds', v: openedIds });

        row.openCloseBtn.close();
        row.clearVal();
      } else {

        if (row.getId()) await this.openId(row.getId());

        const openedIds = await this.getOpenedIds();

        const data = await this.b.p('get', { id: row.getId(), subIds: [...openedIds], depth: 1, getMeta: true });
        await this.rend(data, row.dom);
        row.openCloseBtn.open();
      }

      return;
    }

    if (!this.isKey(t) && !this.isVal(t)) return;
    if (this.isRoot(t)) return;

    if (this.isVal(t)) {
      const row = this.rowInterface(t.parentNode);
      if (row.isValHasSubItems()) return;
    }

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

      const row = this.marked.parentNode;

      if (isKey) {
        const parentId = row.getAttribute('_parent_id');
        const resp = await this.b.p('cp', { id: parentId, oldKey: this.markedTxt, newKey: v });
        console.log(resp);
      } else if (isVal) {
        const id = row.getAttribute('_id');
        if (id === 'vid_stub') return;
        const resp = await this.b.p('set', { id, v: { v } });
        console.log(resp);
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
    const mkBtn = async (txt, fn) => await p('doc.mk', { txt, class: 'menuBtn', events: { click: fn } });

    const containerSize = await p('doc.getSize', { o: this.container });
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
      const v = { v: 'newVal', i: { id: 'vid_stub', t: 'v' } };
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
        if (resp.newId) newRow.setAttribute('_id', resp.newId);
      }

      this.menu.remove();
    });
    this.menu.append(btn);


    const mv = async (dir) => {

      let parentId, k, row = this.marked.parentNode;

      if (!this.isKey(this.marked) && !this.isVal(this.marked)) {
        return;
      }
      if (dir === 'up' && !row.previousSibling) return;
      if (dir === 'down' && !row.nextSibling) return;

      if (this.isKey(this.marked)) {

        const key = this.marked;
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
      const v = await this.b.p('set', { id: parentId, ok });
      console.log(v);

      if (dir === 'up') row.previousSibling.before(row);
      if (dir === 'down') row.nextSibling.after(row);
    }
    btn = await mkBtn('Move up', async (e) => await mv('up'));
    this.menu.append(btn);
    btn = await mkBtn('Move down', async (e) => await mv('down'));
    this.menu.append(btn);

    btn = await mkBtn('Copy', (e) => {
      if (!this.isKey(this.marked)) return;
      this.buffer = { marked: this.marked };
      this.menu.remove();
    });
    this.menu.append(btn);

    if (this.buffer) {
      btn = await mkBtn('Paste', async (e) => {
        const key = this.marked;
        if (!this.isKey(key)) return;

        const row = this.rowInterface(key.parentNode);
        if (row.getType() !== 'm') {
          this.menu.remove();
          return;
        }

        const movingRow = this.rowInterface(this.buffer.marked.parentNode);
        const type = movingRow.getType();
        if (type !== 'm' && type !== 'l') return;

        const data = {
          oldId: movingRow.getParentId(),
          newId: row.getId(),
          key: movingRow.key.innerText,
        };
        const resp = await this.b.p('cp', data);
        console.log(resp);

        row.val.append(movingRow.dom);
        this.buffer = null;
        this.menu.remove();
      });

      this.menu.append(btn);
    }

    btn = await mkBtn('Convert to map', async (e) => {
      const row = this.rowInterface(this.marked.parentNode);
      const id = row.getId();
      if (!id) return;

      const v = { m: {}, o: [], i: { id, t: 'm' } };
      await this.mkRow({
        domId: row.getDomId(), k: row.getKeyValue(), v,
      });
      this.openId(id);

      const r = await this.b.p('set', { id, v });
      console.log(r);
    });
    this.menu.append(btn);
    btn = await mkBtn('Convert to list', async (e) => {
      const row = this.marked.parentNode;
      const id = row.getAttribute('_id');
      if (!id) return;
      const r = await this.b.p('set', { id, v: { l: [] } });
      console.log(r);
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