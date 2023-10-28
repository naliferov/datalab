export const DataEditor = {

    //tree view, list view, card view

    setB(b) { this.b = b; },
    set_(_) { this._ = _; },

    async init(data) {

        const _ = this._;
        const simpleT = new Set(['undefined', 'boolean', 'number', 'bigint', 'string']);

        const p = async (event, data) => await this.b.p(event, data);
        //const i = (o2, o1) => o1.appendChild(o2);
        const add = async (data, parent) => {
            const o = await p('doc.mk', data);
            parent.appendChild(o);
            return o;
        }

        const rendM = async (id, o, parent) => {

            for (let p in o) {
                const v = o[p];

                const row = await add({ class: 'vRow' }, parent);
                if (id) row.setAttribute('vid', id);

                await add({ txt: p, class: 'mapK' }, row);
                await add({ txt: ': ', class: 'mapSep' }, row);

                if (simpleT.has(typeof v)) {
                    //get entity by id; this is openeble item
                    await renderV(0, v, row);
                } else if (v[_]) {

                    if (v.m) {
                        await rendM(v[_].id, v.m, row);
                    } else if (v.v) {
                        await renderV(v[_].id, v.v, row);
                    } else {
                        console.log('else type of var', v);
                    }

                } else {
                    console.log('Unknown type of VAR', v);
                }
            }
        }
        const renderV = async (id, v, parent) => {
            let txt = v;
            if (txt && txt.split) {
                txt = txt.split('\n')[0];
            }
            const val = await add({ txt, class: 'vVal'}, parent);
            if (id) val.setAttribute('vid', id);
        }

        const render = async (id, o, parent) => {
            if (!o[_]) {
                console.log('Unknown VAR', o);
                return;
            }
            if (o.m) await rendM(o['_id'], o.m, parent);
        }

        this.o = await p('doc.mk', { class: 'dataEditor', style: { border: '1px solid black' } });

        //path instead of root

        await render(null, data, this.o);
    },

    async init2() {
        //this.http = new (await s.op('sys.httpClient'));
        this.nodes = new Map;

        const v = await s.f('sys.gui.view');
        this.v = new v({ class: 'dataBrowser' });

        //todo replace dataNode with streams?
        const DataNode = await s.f('sys.apps.GUI.dataNode');
        this.node = DataNode;
        const DataBrowserNode = await s.f('sys.apps.dataBrowserNode');
        this.outlinerNode = DataBrowserNode;

        const dataNode = new DataNode(s);
        const dataBrowserNode = new DataBrowserNode;
        await dataBrowserNode.init(dataNode, true, this);

        dataBrowserNode.removeSubNodesShift();
        e('>', [dataBrowserNode, this.v]);

        this.openedPaths = s.e('localState.get', 'openedPaths');
        if (this.openedPaths) {
            this.openedPaths = JSON.parse(this.openedPaths);
        } else {
            this.openedPaths = {};
        }

        //todo clear this.openedPaths which not exists in "s"
        this.addNode(dataBrowserNode);
        await dataBrowserNode.open(this.openedPaths);

        this.buffer = null;
    }
    // addNode(node) {
    //     this.nodes.set(node.getId(), node);
    // }
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

    // handleContextmenu(e) {
    //     e.preventDefault();
    //
    //     const isDataK = e.target.classList.contains('dataKey');
    //     const isDataV = e.target.classList.contains('dataValue');
    //     if (!isDataK && !isDataV) return;
    //
    //     const node = this.getOutlinerNodeById(e.target.getAttribute('outliner_node_id'));
    //     const dataNode = node.getDataNode();
    //     const data = dataNode.getData();
    //
    //     const v = s.f('sys.gui.view');
    //     const createBtn = (txt) => {
    //         return new v({ txt, class: ['btn', 'contextMenu', 'white', 'hoverGray'] });
    //     }
    //
    //     const popup = s.sys.popup;
    //     let submenu;
    //     const removeSubmenu = () => {
    //         if (!submenu) return;
    //         submenu.clear();
    //         submenu = null;
    //     }
    //
    //     let oBtn = createBtn('Open with');
    //     let openWithBtn = oBtn;
    //     oBtn.on('pointerenter', async () => {
    //         removeSubmenu();
    //         submenu = new (s.f('sys.apps.GUI.popup'));
    //         window.e('app.addViewElement', submenu);
    //
    //         const apps = s.sys.apps;
    //         //todo const authorizedUserApps = s.users[user].apps;
    //
    //         for (let name in apps) {
    //             if (name === 'GUI') continue;
    //             let appBtn = createBtn(name);
    //             appBtn.on('click', () => {
    //                 window.e('openNode', { appPath: `sys.apps.${name}`, outlinerNode: node });
    //                 popup.clear();
    //             });
    //             window.e('>', [appBtn, submenu]);
    //         }
    //         submenu.putRightTo(openWithBtn);
    //     });
    //     window.e('>', [oBtn, popup]);
    //
    //
    //     if (typeof data === 'object' && data !== null) {
    //         oBtn = createBtn('Add item');
    //         oBtn.on('pointerenter', removeSubmenu);
    //         oBtn.on('click', () => {
    //
    //             if (Array.isArray(data)) {
    //                 data.push('item' + data.length + 1);
    //             } else {
    //                 let c = 0;
    //                 while (1) {
    //                     c++;
    //                     const k = 'newKey' + c; const v = 'newValue';
    //                     if (data[k]) continue;
    //
    //                     data[k] = v;
    //                     const dataNode = new this.node;
    //                     dataNode.setPath([...node.getPath(), k]);
    //                     s.e('state.update', { dataNode, data: v });
    //                     break;
    //                 }
    //             }
    //
    //             node.reopen();
    //             popup.clear();
    //         });
    //         window.e('>', [oBtn, popup]);
    //     }
    //
    //     oBtn = createBtn('Copy');
    //     oBtn.on('click', () => {
    //         this.buffer = { mode: 'copy', node };
    //         popup.clear();
    //     });
    //     oBtn.on('pointerenter', removeSubmenu);
    //     window.e('>', [oBtn, popup]);
    //
    //     oBtn = createBtn('Cut');
    //     oBtn.on('click', () => {
    //         this.buffer = { mode: 'cut', node };
    //         popup.clear();
    //     });
    //     oBtn.on('pointerenter', removeSubmenu);
    //     window.e('>', [oBtn, popup]);
    //
    //     if (this.buffer) {
    //         oBtn = createBtn('Paste');
    //         oBtn.on('click', async () => {
    //             if (!this.buffer) return;
    //
    //             const contextNodeData = node.getDataNode().getData();
    //             if (!s.f('sys.isObject', contextNodeData) && !Array.isArray(contextNodeData)) return;
    //
    //             const bufOurlinerNode = this.buffer.outlinerNode;
    //             const dataPath = bufOurlinerNode.getPath();
    //
    //             const dataNodeCopy = new this.node;
    //             //todo in case of array we don't need to set key. just push to array
    //             dataNodeCopy.setPath([...node.getPath(), dataPath.at(-1)]);
    //
    //             const data = structuredClone(bufOurlinerNode.getDataNode().getData());
    //             s.e('state.update', { dataNode: dataNodeCopy, data });
    //             if (this.buffer.mode === 'cut') {
    //                 await s.e('state.del', { outlinerNode: bufOurlinerNode });
    //             }
    //
    //             this.buffer = null;
    //             node.reopen(); //todo remember opened nodes
    //             popup.clear();
    //         });
    //         oBtn.on('pointerenter', removeSubmenu);
    //         window.e('>', [oBtn, popup]);
    //     }
    //
    //     oBtn = createBtn('Duplicate');
    //     oBtn.on('click', async () => {
    //         await this.duplicate(node);
    //         popup.clear();
    //     });
    //     oBtn.on('pointerenter', removeSubmenu);
    //     window.e('>', [oBtn, popup]);
    //
    //     oBtn = createBtn('Console log');
    //     oBtn.on('pointerenter', removeSubmenu);
    //     oBtn.on('click', () => {
    //         s.l(dataNode);
    //         popup.clear();
    //     });
    //     window.e('>', [oBtn, popup]);
    //
    //     oBtn = createBtn('Console path');
    //     oBtn.on('pointerenter', removeSubmenu);
    //     oBtn.on('click', () => {
    //         s.l(node.getPath());
    //         popup.clear();
    //     });
    //     window.e('>', [oBtn, popup]);
    //
    //     oBtn = createBtn('Convert type to');
    //     let convertTypeBtn = oBtn;
    //     oBtn.on('pointerenter', () => {
    //         removeSubmenu();
    //         submenu = new (s.f('sys.apps.GUI.popup'));
    //         window.e('app.addViewElement', submenu);
    //
    //         const types = ['Bool', 'String', 'Object', 'Array'];
    //         types.forEach(t => {
    //             let btn = createBtn(t);
    //             btn.on('click', () => {
    //                 let data;
    //                 if (t === 'Array') data = [];
    //                 else if (t === 'Bool') {
    //                     data = dataNode.getData() === 'false' ? false : true;
    //                 }
    //                 else if (t === 'Object') data = {};
    //                 else if (t === 'String') data = 'str';
    //                 else if (data === undefined) return;
    //                 s.e('state.update', { outlinerNode: node, data });
    //
    //                 node.getParent().reopen();
    //                 popup.clear();
    //             });
    //             window.e('>', [btn, submenu]);
    //         });
    //         submenu.putRightTo(convertTypeBtn);
    //
    //     });
    //     window.e('>', [oBtn, popup]);
    //
    //     popup.onClear(() => removeSubmenu());
    //     popup.putRightToPointer({ x: e.clientX, y: e.clientY });
    // }
}