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
    display: inline;
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

    const rendM = async (o, parentRow, parentVid) => {

      if (!o.m) return;
      if (!o.o) { console.error('No order array for map', parentVid, o); return; }

      for (let k of o.o) {
        if (!o.m[k]) { console.error(`Warning key [${k}] not found in map`, o); return; }

        const v = o.m[k];
        if (!v[_]) { console.log('2: Unknown type of VAR', v); return; }

        const xx = await this.mkXX({
          x1: k, x2: v,
          parentVid, vid: v[_].id
        });
        this.rowInterface(parentRow).x2.append(xx);

        if (v.m) await rendM(v, xx, v[_].id);
        else if (v.l) await rendL(v, xx, v[_].id);
        else if (v.v) {}
        else console.log('Unknown type of var', v);
      }
    }
    const rendL = async (o, parentRow, parentVid) => {
      if (!o.l) return;

      for (let v of o.l) {
        if (!v[_]) { console.log('2: Unknown type of VAR', v); return; }

        const xx = await this.mkXX({ x2: v, parentVid, vid: v[_].id });
        this.rowInterface(parentRow).x2.append(xx);

        if (v.m) await rendM(v, xx, v[_].id);
        else if (v.l) await rendL(v, xx, v[_].id);
        else if (v.v) {}
        else console.log('Unknown type of var', v);
      }
    }
    const rend = async (o, parent) => {
      if (!o[_]) {
        console.log('Unknown VAR', o);
        return;
      }
      if (o.m) await rendM(o, parent, o[_].id);
      if (o.l) await rendL(o, parent, o[_].id);
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

    const root = await this.mkXX({ x1: 'root', x2: {m: {}}, vid: 'root' });
    container.append(root);

    const data = await p('get', { path, depth: 5 }); console.log(data);
    await rend(data, root);
  },
  async mkXX(x) {
    const { x1, x2, parentVid, vid } = x;

    const r = await this.b.p('doc.mk', { class: 'row' });
    if (x2) {
      if (x2.l) r.setAttribute('t', 'l');
      if (x2.m) r.setAttribute('t', 'm');
    }

    let x1DOM;
    if (x1) {
      x1DOM = await this.b.p('doc.mk', { txt: x1, class: 'key' });
      r.append(x1DOM);
      if (parentVid) x1DOM.setAttribute('parent_vid', parentVid);
      if (vid) x1DOM.setAttribute('vid', vid);

      const sep = await this.b.p('doc.mk', { txt: ': ', class: ['sep', 'inline'] });
      r.append(sep);
    }

    const x2DOM = await this.b.p('doc.mk', { class: 'v' });
    r.append(x2DOM);

    if (x2 && x2.v) {

      let txt = x2.v;
      if (txt && txt.split) txt = txt.split('\n')[0];

      const v = await this.b.p('doc.mk', { txt, class: ['val'] });
      if (vid) v.setAttribute('vid', vid);

      x2DOM.classList.add('inline');
      x2DOM.append(v);
    }

    return r;
  },
  rowInterface(xx) {
    const children = xx.children;

    if (children.length === 1) {
      return {
        xx: xx,
        val() {
          return this.xx.children[0].children[0];
        },
        getType() { return this.xx.getAttribute('t') },
      }
    }

    return {
      xx: xx,
      x1: children[0],
      separator: children[1],
      x2: children[2],
      val() {
        return this.x2.children[0];
      },
      getType() { return this.xx.getAttribute('t') },
    }
  },
  getOrderKey(item, type) {

    const rows = item.parentNode.parentNode.children;
    for (let i = 0; i < rows.length; i++) {

      let element;
      if (type === 'm') element = this.rowInterface(rows[i]).x1;
      else if (type === 'l') element = this.rowInterface(rows[i]).val();

      if (element && this.isMarked(element)) {
        return i;
      }
    }
  },
  isRoot(t) { return t.getAttribute('vid') === 'root' },
  isX1(t) { return t.classList.contains('key'); },
  isX2(t) { return t.classList.contains('v'); },
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

      const isX1 = this.isX1(this.marked);
      const isVal = this.isVal(this.marked);

      if (isX1) {
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

    const isX1 = t.classList.contains('key');
    const isV = t.classList.contains('val');
    if (!isX1 && !isV) return;

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
      if (!this.isX1(mark) && !this.isX2(mark)) return;

      const row = this.rowInterface(mark.parentNode);
      const type = row.getType();

      if (type === 'm') {
        const k = 'newKey';
        const v = {v: 'newVal'};
        const newRow = await this.mkXX({
          x1: k, x2: v,
          parentVid: row.x1.getAttribute('vid'),
          vid: 'vid_stub',
        });
        row.x2.append(newRow);

        const id = row.x1.getAttribute('vid');
        const resp = await p('set', {id, type: 'm', k, ok: row.x2.children.length - 1, v});
        console.log(resp);

        if (resp.newId) {
          const newRowAPI = this.rowInterface(newRow);
          newRowAPI.x1.setAttribute('vid', resp.newId);
        }
      }

      if (type === 'l') {
        const v = {v: 'newVal'};
        const newRow = await this.mkXX({
          x2: v,
          parentVid: row.x1.getAttribute('vid'),
          vid: 'vid_stub',
        });
        row.x2.append(newRow);

        const id = row.x1.getAttribute('vid');
        const resp = await p('set', {id, type: 'l', v});
        console.log(resp);

        if (resp.newId) {
          const val = this.rowInterface(newRow).val();
          if (val) val.setAttribute('vid', resp.newId);
        }
      }

      this.menu.remove();
    });
    this.menu.append(btn);


    if (this.isRoot(t)) return;

    const mv = async (dir) => {

      let parentId, k;

      if (this.isX1(this.marked)) {

        const x1 = this.marked;
        if (dir === 'up' && !x1.parentNode.previousSibling) return;
        if (dir === 'down' && !x1.parentNode.nextSibling) return;

        parentId = x1.getAttribute('parent_vid');
        k = this.getOrderKey(x1, 'm');

      } else {
        if (this.isX2(this.marked.parentNode)) {

          const x2 = this.marked.parentNode;
          const row = x2.parentNode;

          if (dir === 'up' && !row.previousSibling) return;
          if (dir === 'down' && !row.nextSibling) return;

          if (row.getAttribute('t')) return;

          const parentRowInterface = this.rowInterface(row.parentNode.parentNode);
          if (parentRowInterface.xx.getAttribute('t') !== 'l') {
            return;
          }
          parentId = parentRowInterface.x1.getAttribute('vid');
          k = this.getOrderKey(x2, 'l');
        }
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
      if (!this.isX1(x1)) return;

      const parentId = x1.getAttribute('parent_vid');
      const key = x1.innerText;
      this.buffer = {id: parentId, key, xx: this.rowInterface(x1.parentNode)};
      this.menu.remove();
    });
    this.menu.append(btn);

    if (this.buffer) {
      btn = await mkBtn('Paste', async (e) => {
        const x1 = this.marked;
        if (!this.isX1(x1)) return;

        const xx = this.rowInterface(x1.parentNode);
        if (this.isV(xx.x2)) {
          this.menu.remove();
          return;
        }

        const resp = await this.b.p('cp', {
          oldId: this.buffer.id,
          newId: x1.getAttribute('vid'),
          key: this.buffer.key,
        });
        console.log(resp);

        xx.x2.append(this.buffer.xx.xx);
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
      if (!this.marked || !this.isX1(this.marked)) return;

      const x1 = this.marked;
      const id = x1.getAttribute('vid');
      const parentId = x1.getAttribute('parent_vid');
      const k = x1.innerText;

      let ok = this.getOrderKeyOfX1(x1);
      if (ok === undefined) {
        console.log('ok not found');
        return;
      }

      if (!parentId || !k) return;
      this.menu.remove();

      const v = await this.b.p('del', {id: parentId, k, ok});
      console.log(v);
      x1.parentNode.remove();
    });
    this.menu.append(btn);
  }
  // removeNode(id) {
  //     this.nodes.delete(id);
  // }
  //deactivate() { this.v.hide(); }
  //close() { }
  //isEmpty() { return this.outLinerRootNode.isEmpty()}
  //getOutlinerNodeById(id) { return this.nodes.get(id); }

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

  // async handleKeydown(e) {
  //
  //     if (!e.target.classList.contains('dataKey')) return;
  //
  //
  //     const outlinerNode = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
  //     if (!outlinerNode) { console.log('outlinerNode not found'); return; }
  //
  //     const k = e.key;
  //     const ctrl = e.ctrlKey || e.metaKey;
  //
  //     if (k === 'Enter') {
  //         e.preventDefault();
  //     } else if (k === 'Tab') {
  //         e.preventDefault();
  //         //todo reimplement later
  //         // if (e.shiftKey) {
  //         //     const parent = outlinerNode.getParent();
  //         //     window.e('>after', [outlinerNode.getV(), parent.getV()]);
  //         // } else if (outlinerNode.prev()) {
  //         //     window.e('>', [outlinerNode.getV(), outlinerNode.prev().getNodesV()]);
  //         // }
  //
  //     } /*else if (ctrl && k === 'ArrowUp' && outlinerNode.prev()) {
  //             window.e('>after', [outlinerNode.prev().getV(), outlinerNode.getV()]);
  //         } else if (ctrl && k === 'ArrowDown' && outlinerNode.next()) {
  //             window.e('>after', [outlinerNode.getV(), outlinerNode.next().getV()]);
  //         } */else {
  //         return;
  //     }
  //     e.target.focus();
  //     //await this.save();
  // }

  // async handleKeyup(e) {
  //
  //     if (!e.target.classList.contains('dataKey')) return;
  //
  //     const ignoreKeys = ['Enter', 'Tab', 'Control', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  //     if (new Set(ignoreKeys).has(e.key)) return;
  //
  //     const outlinerNode = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
  //
  //     const dataNode = outlinerNode.getDataNode();
  //     const newK = e.target.innerText;
  //     const v = dataNode.getData();
  //
  //     if (newK.length === 0) {
  //         if (!confirm('Delete object?')) return;
  //         s.e('state.del', { outlinerNode })
  //         return;
  //     }
  //
  //     const oldPath = outlinerNode.getPath();
  //     const newPath = oldPath.length === 1 ? [newK] : [...oldPath.slice(0, -1), newK];
  //
  //     if (newPath.toString() === oldPath.toString()) return;
  //
  //     await this.http.post('/stateUpdate', { cmds: [{ newPath: newPath, oldPath: oldPath, op: 'mv' }] });
  //     const parentDataNode = outlinerNode.getParent().getDataNode();
  //
  //     parentDataNode.set(newPath.at(-1), v);
  //     parentDataNode.del(oldPath.at(-1));
  //
  //     dataNode.setKey(newK);
  // }

  // async handleClick(e) {
  //
  //     const addOpenedNode = node => {
  //         //todo some func to direct iteration in depth of object by path
  //         let lastObj = this.openedPaths;
  //         const path = node.getPath();
  //
  //         for (let i = 0; i < path.length; i++) {
  //             const part = path[i];
  //             if (!lastObj[part]) lastObj[part] = {};
  //             lastObj = lastObj[part];
  //         }
  //         s.e('localState.set', ['openedPaths', JSON.stringify(this.openedPaths)]);
  //     }
  //     const deleteOpenedNode = node => {
  //
  //         let lastObj = this.openedPaths;
  //         let lastPart;
  //         const path = node.getPath();
  //
  //         for (let i = 0; i < path.length; i++) {
  //             const part = path[i];
  //             const isLastIndex = i === path.length - 1;
  //             if (isLastIndex) {
  //                 delete lastObj[part];
  //                 break;
  //             }
  //             lastObj = lastObj[part];
  //             lastPart = part;
  //         }
  //         s.e('localState.set', ['openedPaths', JSON.stringify(this.openedPaths)]);
  //     }
  //     const classList = e.target.classList;
  //
  //     if (classList.contains('openClose') || classList.contains('openCloseArrow')) {
  //
  //         let outlinerNode = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
  //         if (!outlinerNode.hasSomethingToOpen()) {
  //             return;
  //         }
  //         if (outlinerNode.isOpened) {
  //             outlinerNode.close()
  //             deleteOpenedNode(outlinerNode);
  //         } else {
  //             outlinerNode.open();
  //             addOpenedNode(outlinerNode);
  //         }
  //         return;
  //     }
  //
  //     if (classList.contains('dataKey')) {
  //
  //         let node = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
  //         if (!node.hasSomethingToOpen()) return;
  //         if (!node.isOpened) {
  //             node.open();
  //             addOpenedNode(node);
  //         }
  //     }
  // }
}