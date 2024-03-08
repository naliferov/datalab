import { DomPart } from "./DomPart.js";

export class Header extends DomPart {

  css = `
    .container {
      display: flex;
      font-family: 'Roboto', sans-serif;
      align-items: center;
      padding: 10px 0;
    }
    .logo {
      font-size: 23px;
      font-weight: bold;
    }
    .leftMenu {
      flex-grow: 1;
    }
    .btn {
      cursor: pointer;
    }
    .btn:hover {
      text-decoration: underline;
    }
  `;

  constructor(data = {}) {

    data.type = 'header';

    super(data);
    this.attachShadow();
    this.attachCSS();

    const container = new DomPart({ class: 'container' });
    this.ins(container);

    const logo = new DomPart({ class: 'logo', txt: 'VARCRAFT' });
    container.ins(logo);

    const leftMenu = new DomPart({ class: 'leftMenu' });
    container.ins(leftMenu);

    const rightMenu = new DomPart({ class: 'rightMenu', css: { display: 'flex' } });
    container.ins(rightMenu);

    //signName

    const signInBtn = new DomPart({ class: ['signIn', 'btn'], txt: 'Sign In' });
    rightMenu.ins(signInBtn);
  }

  async init() {

    const b = this.b;

    this.o = await b.p('doc.mk', { type: 'header' });
    this.oShadow = this.o.attachShadow({ mode: 'open' });
    //this.oShadow.append(await this.createStyle());
    //this.oShadow.addEventListener('contextmenu', (e) => this.handleContextmenu(e));

    const container = await b.p('doc.mk', { class: 'container' });
    this.oShadow.append(container);

    const logo = await b.p('doc.mk', { class: 'logo', txt: 'varcraft' });
    await b.p('doc.ins', { o1: container, o2: logo });
  }
}