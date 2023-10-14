async () => {
    return class MonacoEditor {

        constructor(dataNode, v) {
            this.dataNode = dataNode;
            this.v = new v({ class:['monacoEditor']});
            this.isEditorInitiated = false;
        }

        activate() {
            this.show();

            if (this.isEditorInitiated) return;
            this.isEditorInitiated = true;

            // this.dataBrowser = ace.edit(this.v.getDOM(), {mode: 'ace/mode/javascript', selectionStyle: 'text'});
            // this.dataBrowser.setTheme('ace/theme/iplastic');
            // this.dataBrowser.session.on('changeMode', (e, session) => {
            //     if ("ace/mode/javascript" === session.getMode().$id) {
            //         if (!!session.$worker) {
            //             session.$worker.send("setOptions", [{"esversion": 9, "esnext": false}]);
            //         }
            //     }
            // });
            // this.dataBrowser.session.setUseWorker(false);
            // this.dataBrowser.session.setMode('ace/mode/javascript');
            // this.dataBrowser.setValue(this.outlinerNode.getContextNode().getData(), 1);
            //this.dataBrowser.destroy();

            this.editor = monaco.editor.create(this.v.getDOM(), {
                value: this.dataNode.getData(),
                automaticLayout: true,
                language: 'javascript', fontSize: '14px', theme: 'vs-light',
            });
            //this.dataBrowser.layout();
            this.editor.getModel().onDidChangeContent(async e => {
                const value = this.editor.getValue();
                // try { eval(js); s.e('JsEvalResult', {error: 0}); }
                // catch (e) { s.e('JsEvalResult', {error: e}); }

                s.e('state.update', {dataNode: this.dataNode, data: value});
            });
        }
        deactivate() {
            this.hide();
        }

        getV() { return this.v; }
        show() { this.v.show(); }
        hide() { this.v.hide(); }
        close() { this.v.removeFromDom(); }
    }
}