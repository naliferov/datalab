export const Frame = {

  setB(b) { this.b = b },
  async createStyle() {

    // .topBar {
    //         width: 100%;
    //         display: flex;
    //         align-items: center;
    //         padding: 0.5em 0;
    //         background: rgba(55, 53, 47, 0.08);
    //         cursor: pointer;
    //     }

    const css = `
    .container {}
    .shadow {
        box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);
    }
    .frame {
        position: absolute;
        /*top: 30px;*/
        overflow: hidden;
    }
    /* this create small glitches when after start and drag window */
    .frame.drag {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none;   /* Chrome/Safari/Opera */
        -khtml-user-select: none;    /* Konqueror */
        -moz-user-select: none;      /* Firefox */
        -ms-user-select: none;       /* Internet Explorer/Edge*/
        user-select: none;
    }

    .frame.drag .topBar {
        cursor: move;
    }
    .appTitle {
        font-weight: bold;
        white-space: nowrap;
        margin-left: 5px;
    }
    .resizer {
        position: absolute;
        min-width: 0.8em;
        min-height: 0.8em;
    }
    .resizeTop {
        left: 0.5em;
        right: 0.5em;
        top: -0.5em;
        cursor: ns-resize;
    }
    .resizeBottom {
        left: 0.5em;
        right: 0.5em;
        bottom: -0.5em;
        cursor: ns-resize;
    }
        `;
    return await this.b.p('doc.mk', { type: 'style', txt: css });
  },

  async init() {

    const p = async (event, data) => await this.b.p(event, data);

    this.o = await p('doc.mk', {
      class: ['frame'], css: {
        minWidth: '100px', minHeight: '100px', position: 'absolute',
      }
    });

    this.oShadow = this.o.attachShadow({ mode: 'open' });
    this.oShadow.appendChild(await this.createStyle());

    const top = await p('doc.mk', { class: ['topBar'] });
    await p('doc.ins', { o1: this.oShadow, o2: top });

    this.container = await p('doc.mk', { class: 'container' });
    this.oShadow.appendChild(this.container);

    const slot = await p('doc.mk', { type: 'slot' });
    slot.setAttribute('name', 'content');
    this.container.append(slot);

    //top.on('pointerdown', (e) => this.topBarDragAndDrop(e));

    // const closeBtn = new this.O({ class: 'closeBtn' });
    // e('>', [closeBtn, top]);
    // closeBtn.on('click', () => {
    //     this.view.remove();
    //     if (this.app.close) {
    //         this.app.close();
    //     }
    //     s.e('appFrame.close', { appFrame: this });
    // });

    //const title = new v({ txt: this.app.getTitle(), class: 'appTitle' });
    //e('>', [title, topBar]);

    return;

    const resizeTop = await p('doc.mk', { class: ['resizer', 'resizeTop'] });
    await p('doc.ins', { o1: this.oShadow, o2: resizeTop });
    //resizeTop.on('pointerdown', (e) => this.resizeTop(e, resizeTop));

    const nsResizeBottom = await p('doc.mk', { class: ['resizer', 'resizeBottom'] });
    await p('doc.ins', { o1: this.oShadow, o2: nsResizeBottom });
    await p('doc.on', { e: 'pointerdown', o: nsResizeBottom, f: (e) => this.resizeBottom(e) });

    //nsResizeBottom.on('pointerdown', (e) => this.resizeBottom(e));
    return;


    const resizeLeft = new v({ class: ['resizer', 'resizeLeft'] });
    //e('>', [resizeLeft, this.view]);
    resizeLeft.on('pointerdown', (e) => this.resizeLeft(e));

    const resizeRight = new v({ class: ['resizer', 'resizeRight'] });
    e('>', [resizeRight, this.view]);
    resizeRight.on('pointerdown', (e) => this.resizeRight(e));



    const resizeTopLeft = new v({ class: ['resizer', 'resizeTopLeft'] });
    e('>', [resizeTopLeft, this.view]);
    resizeTopLeft.on('pointerdown', (e) => this.resizeTopLeft(e));

    const resizeTopRight = new v({ class: ['resizer', 'resizeTopRight'] });
    e('>', [resizeTopRight, this.view]);
    resizeTopRight.on('pointerdown', (e) => this.resizeTopRight(e));

    const resizeBottomLeft = new v({ class: ['resizer', 'resizeBottomLeft'] });
    e('>', [resizeBottomLeft, this.view]);
    resizeBottomLeft.on('pointerdown', (e) => this.resizeBottomLeft(e));

    const resizeBottomRight = new v({ class: ['resizer', 'resizeBottomRight'] });
    e('>', [resizeBottomRight, this.view]);
    resizeBottomRight.on('pointerdown', (e) => this.resizeBottomRight(e));
  },

  setContent(content) {
    content.setAttribute('slot', 'content');
    this.o.append(content);
  },

  recalcDimensions() {
    const height = this.view.getSizes().height - this.topBar.getSizes().height;
    this.content.setSize(null, height);
  },
  setPosition(x, y) { this.view.setPosition(x, y); },
  setSize(width, height) { this.view.setSize(width, height); },
  getSizes() { return this.view.getSize(); },
  setDefaultSize() {
    if (this.app.getDefaultSize) {
      const { width, height } = this.app.getDefaultSize();
      this.setSize(width, height);
    }
  },

  topBarDragAndDrop(e) {
    const viewSizes = this.view.getSizes();
    const shift = { x: e.clientX - viewSizes.x, y: e.clientY - viewSizes.y };
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const x = e.clientX - shift.x;
        const y = e.clientY - shift.y;
        this.view.setPosition(x, y);
        s.e('appFrame.changePosition', { appFrame: this, x, y });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTop(e) {

    const sizes = this.view.getSizes();

    const maxY = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxY - (e.clientY);
        this.view.setSize(null, height);
        this.view.setPosition(null, e.clientY);

        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, height });
        s.e('appFrame.changePosition', { appFrame: this, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottom(e) {
    console.log('test 9999');

    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = e.clientY - sizes.y;
        this.view.setSize(null, height);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, height });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = maxW - e.clientX;
        this.view.setSize(width);
        this.view.setPosition(e.clientX);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeRight(e) {
    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = e.clientX - sizes.x;
        this.view.setSize(width);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTopLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    const maxН = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxН - e.clientY;
        const width = maxW - e.clientX;
        this.view.setSize(width, height);
        this.view.setPosition(e.clientX, e.clientY);
        this.recalcDimensions();

        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTopRight(e) {
    const sizes = this.view.getSizes();
    const maxН = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxН - e.clientY;
        const width = e.clientX - sizes.x;
        this.view.setSize(width, height);
        this.view.setPosition(null, e.clientY);
        this.recalcDimensions();

        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottomLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = maxW - e.clientX;
        const height = e.clientY - sizes.y;

        this.view.setSize(width, height);
        this.view.setPosition(e.clientX);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottomRight(e) {

    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = e.clientX - sizes.x;
        const height = e.clientY - sizes.y;
        this.view.setSize(width, height);
        this.recalcDimensions();
        //s.e('appFrame.changeSize', { appFrame: this, width, height });
      },
      up: (e) => {
        //s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
}