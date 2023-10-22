export const bus = {
    handlers: {},
    async pub(event, data) {
        if (!this.handlers[event]) return;
        return await this.handlers[event](data);
    },
    async p(event, data) { return await this.pub(event, data); },
    async sub(event, handler) {
        if (this.handlers[event]) {
            await this.pub('log', { msg: `Handler for event [${event}] already set.` });
        }
        this.handlers[event] = handler;
    },
    async s(event, handler) { return await this.sub(event, handler); },
}

export const ps = {
    setHandlers(handlers) {
        this.handlers = handlers;
    },
    async p(e, data) {
        if (!this.handlers[e]) return;

        return await this.handlers[e](data);
    },
    async s(e, handler) {
        if (this.handlers[e]) {
            await this.p('log', { msg: `Handler for event [${e}] already set.` });
        }
        this.handlers[e] = handler;
    }
}