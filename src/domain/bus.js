export const bus = {
    handlers: {},
    async pub(event, data) {
        if (!this.handlers[event]) return;

        return await this.handlers[event](data);
    },
    async sub(event, handler) {
        if (this.handlers[event]) {
            await this.pub('log', { msg: `Handler for event [${event}] already set.` });
        }
        this.handlers[event] = handler;
    }
}