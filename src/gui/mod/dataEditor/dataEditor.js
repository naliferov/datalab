export const DataEditor = {

  setB(b) { this.b = b; },
  set_(_) { this._ = _; },

  async createStyle() {

    const css = `
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
}
.menuBtn:hover {
    background: #ababab;
}

div[contenteditable="true"] {
    outline: none;
}
.xx {
    margin-left: 10px;
}
.x1 {
    cursor: pointer;
    border: 1px solid transparent;
    display: inline;
    font-weight: bold;
}
.sep, .x2.v { display: inline; }

.val {
    cursor: pointer;
    border: 1px solid transparent;
    display: inline;
}

.x1.mark,
.val.mark {
    background: lightblue;
}
.x1[contenteditable="true"],
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

    const rendM = async (o, parentXX, parentVid) => {
      for (let p in o) {
        const v = o[p];
        if (!v[_]) { console.log('2: Unknown type of VAR', v); return; }

        const xx = await this.mkXX({
          x1: p, x2: v,
          parentVid, vid: v[_].id
        });
        parentXX.children[2].append(xx);

        if (v.m) await rendM(v.m, xx, v[_].id);
        else if (v.l || v.v) { }
        else console.log('1: Unknown type of var', v);
      }
    }
    const rendL = async () => { }
    const rend = async (o, parent) => {
      if (!o[_]) {
        console.log('Unknown VAR', o);
        return;
      }
      if (o.m) await rendM(o.m, parent, o[_].id);
      if (o.l) await rendL(o.l, parent, o[_].id);
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

    const root = await this.mkXX({ x1: 'root', vid: 'root' });
    container.append(root);

    const data = await p('get', { path, depth: 5 }); console.log(data);
    await rend(data, root);
  },
  isRoot(t) {
    return t.getAttribute('vid') === 'root'
  },
  isX1(t) {
    return t.classList.contains('x1');
  },
  isVal(t) {
    return t.classList.contains('val');
  },
  async mkXX(x) {
    const { x1, x2, parentVid, vid } = x;

    const r = await this.b.p('doc.mk', { class: 'xx' });

    const x1DOM = await this.b.p('doc.mk', { txt: x1, class: 'x1' });
    r.append(x1DOM);

    if (parentVid) x1DOM.setAttribute('parent_vid', parentVid);
    if (vid) x1DOM.setAttribute('vid', vid);

    const sep = await this.b.p('doc.mk', { txt: ': ', class: 'sep' });
    r.append(sep);

    const x2DOM = await this.b.p('doc.mk', { class: 'x2' });
    r.append(x2DOM);

    if (x2 && x2.v) {

      let txt = x2.v;
      if (txt && txt.split) txt = txt.split('\n')[0];

      const v = await this.mkRowV(txt);
      if (vid) v.setAttribute('vid', vid);

      x2DOM.classList.add('v');
      x2DOM.append(v);
    }

    return r;
  },
  async mkRowV(v) {
    return await this.b.p('doc.mk', { txt: v, class: 'val' });
  },
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
      if (this.marked.innerText !== this.markedV) {
        this.marked.innerText = this.markedV;
      }
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
      if (v === this.markedV) return;
      if (!v) {
        alert('No value is set.'); return;
      }

      const isX1 = this.isX1(this.marked);
      const isVal = this.isVal(this.marked);

      if (isX1) {
        const parentId = this.marked.getAttribute('parent_vid');
        await this.b.p('cp', { id: parentId, oldKey: this.markedV, newKey: v });
      }
      else if (isVal) {
        const id = this.marked.getAttribute('vid');
        await this.b.p('set', { id, v: { v } });
      }
      return;
    }

    this.unmark();
    this.marked.setAttribute('contenteditable', 'true');
    this.marked.focus();
    this.markedV = this.marked.innerText;
  },
  async handleContextmenu(e) {
    e.preventDefault();
    const t = e.target;

    const isX1 = t.classList.contains('x1');
    const isV = t.classList.contains('val');
    if (!isX1 && !isV) return;

    this.remark(t);

    const p = async (event, data) => await this.b.p(event, data);
    const mkBtn = async (txt, fn) => await p('doc.mk', { txt, class: 'menuBtn', events: { click: fn } });

    const containerSize = await p('doc.getSize', { o: this.container });
    const menu = await p('doc.mk', {
      class: 'menu', css: {
        left: (e.clientX - containerSize.x) + 'px',
        top: (e.clientY - containerSize.y) + 'px',
      }
    });
    if (this.menu) this.menu.remove();
    this.menu = menu;
    this.container.append(menu);

    //todo expand, collapse, structural stream;
    let btn = await mkBtn('Open', (e) => console.log(e));
    //this.menu.append(btn);

    btn = await mkBtn('Add', async (e) => {
      if (!this.marked || !this.isX1(this.marked)) return;

      const x1 = this.marked;
      const x2 = x1.nextSibling?.nextSibling;
      if (!x2 || !x2.classList.contains('x2')) return;
      if (x2.classList.contains('v')) return;

      const id = x1.getAttribute('vid');
      const v = await p('set', { id, k: 'newKey', v: { v: 'newValue' } });
      console.log(v);

      const xx = await this.mkXX({
        x1: 'newKey',
        x2: { v: 'newValue' },
        parentVid: x1.getAttribute('parent_vid'),
        vid: 'new created v ID',
      });
      x2.append(xx);

      this.menu.remove();
    });
    this.menu.append(btn);

    if (this.isRoot(t)) return;

    btn = await mkBtn('Remove', async (e) => {
      if (!this.marked || !this.isX1(this.marked)) return;

      const x1 = this.marked;
      const id = x1.getAttribute('vid');
      const parentId = x1.getAttribute('parent_vid');
      const k = x1.innerText;

      const xxList = x1.parentNode.parentNode.children;
      let oKey;

      for (let i = 0; i < xxList.length; i++) {
        const xx = xxList[i];
        const x1Element = xx.children[0];
        if (id === x1Element.getAttribute('vid')) oKey = i;
      }
      if (oKey === undefined) {
        console.log('oKey not found');
        return;
      }

      if (!parentId || !k) return;
      this.menu.remove();

      const v = await this.b.p('del', { id: parentId, k, oKey });
      console.log(v);
      x1.parentNode.remove();
    });
    this.menu.append(btn);
    btn = await mkBtn('Copy', (e) => console.log(e));
    this.menu.append(btn);

    return;

    let submenu;
    const removeSubmenu = () => {
      if (!submenu) return;
      submenu.clear();
      submenu = null;
    }

    let oBtn = createBtn('Open with');
    let openWithBtn = oBtn;
    oBtn.on('pointerenter', async () => {
      removeSubmenu();
      submenu = new (s.f('sys.apps.GUI.popup'));
      window.e('app.addViewElement', submenu);

      const apps = s.sys.apps;
      //todo const authorizedUserApps = s.users[user].apps;

      for (let name in apps) {
        if (name === 'GUI') continue;
        let appBtn = createBtn(name);
        appBtn.on('click', () => {
          window.e('openNode', { appPath: `sys.apps.${name}`, outlinerNode: node });
          popup.clear();
        });
        window.e('>', [appBtn, submenu]);
      }
      submenu.putRightTo(openWithBtn);
    });
    window.e('>', [oBtn, popup]);


    if (typeof data === 'object' && data !== null) {
      oBtn = createBtn('Add item');
      oBtn.on('pointerenter', removeSubmenu);
      oBtn.on('click', () => {

        if (Array.isArray(data)) {
          data.push('item' + data.length + 1);
        } else {
          let c = 0;
          while (1) {
            c++;
            const k = 'newKey' + c; const v = 'newValue';
            if (data[k]) continue;

            data[k] = v;
            const dataNode = new this.node;
            dataNode.setPath([...node.getPath(), k]);
            s.e('state.update', { dataNode, data: v });
            break;
          }
        }

        node.reopen();
        popup.clear();
      });
      window.e('>', [oBtn, popup]);
    }

    oBtn = createBtn('Copy');
    oBtn.on('click', () => {
      this.buffer = { mode: 'copy', node };
      popup.clear();
    });
    oBtn.on('pointerenter', removeSubmenu);
    window.e('>', [oBtn, popup]);

    oBtn = createBtn('Cut');
    oBtn.on('click', () => {
      this.buffer = { mode: 'cut', node };
      popup.clear();
    });
    oBtn.on('pointerenter', removeSubmenu);
    window.e('>', [oBtn, popup]);

    if (this.buffer) {
      oBtn = createBtn('Paste');
      oBtn.on('click', async () => {
        if (!this.buffer) return;

        const contextNodeData = node.getDataNode().getData();
        if (!s.f('sys.isObject', contextNodeData) && !Array.isArray(contextNodeData)) return;

        const bufOurlinerNode = this.buffer.outlinerNode;
        const dataPath = bufOurlinerNode.getPath();

        const dataNodeCopy = new this.node;
        //todo in case of array we don't need to set key. just push to array
        dataNodeCopy.setPath([...node.getPath(), dataPath.at(-1)]);

        const data = structuredClone(bufOurlinerNode.getDataNode().getData());
        s.e('state.update', { dataNode: dataNodeCopy, data });
        if (this.buffer.mode === 'cut') {
          await s.e('state.del', { outlinerNode: bufOurlinerNode });
        }

        this.buffer = null;
        node.reopen(); //todo remember opened nodes
        popup.clear();
      });
      oBtn.on('pointerenter', removeSubmenu);
      window.e('>', [oBtn, popup]);
    }

    oBtn = createBtn('Duplicate');
    oBtn.on('click', async () => {
      await this.duplicate(node);
      popup.clear();
    });
    oBtn.on('pointerenter', removeSubmenu);
    window.e('>', [oBtn, popup]);

    oBtn = createBtn('Console log');
    oBtn.on('pointerenter', removeSubmenu);
    oBtn.on('click', () => {
      s.l(dataNode);
      popup.clear();
    });
    window.e('>', [oBtn, popup]);

    oBtn = createBtn('Console path');
    oBtn.on('pointerenter', removeSubmenu);
    oBtn.on('click', () => {
      s.l(node.getPath());
      popup.clear();
    });
    window.e('>', [oBtn, popup]);

    oBtn = createBtn('Convert type to');
    let convertTypeBtn = oBtn;
    oBtn.on('pointerenter', () => {
      removeSubmenu();
      submenu = new (s.f('sys.apps.GUI.popup'));
      window.e('app.addViewElement', submenu);

      const types = ['Bool', 'String', 'Object', 'Array'];
      types.forEach(t => {
        let btn = createBtn(t);
        btn.on('click', () => {
          let data;
          if (t === 'Array') data = [];
          else if (t === 'Bool') {
            data = dataNode.getData() === 'false' ? false : true;
          }
          else if (t === 'Object') data = {};
          else if (t === 'String') data = 'str';
          else if (data === undefined) return;
          s.e('state.update', { outlinerNode: node, data });

          node.getParent().reopen();
          popup.clear();
        });
        window.e('>', [btn, submenu]);
      });
      submenu.putRightTo(convertTypeBtn);

    });
    window.e('>', [oBtn, popup]);

    popup.onClear(() => removeSubmenu());
    popup.putRightToPointer({ x: e.clientX, y: e.clientY });
  },

  addNode(node) {
    //this.nodes.set(node.getId(), node);
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