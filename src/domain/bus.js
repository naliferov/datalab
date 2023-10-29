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