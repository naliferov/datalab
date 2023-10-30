export const x = async (b) => {

    const _ = await b.p('get_');

    return async (x) => {
        if (x[_].x === undefined) {
            return await b.p(x[_].e, x);
        }
        if (x[_].x) {
            return await b.s(x[_].e, x[_].f);
        }
    }
}

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

const i = async (x) => {

    const { b, id, path, data, type } = x;
    let repo = x.repo || 'default';

    if (id) { //update v, if key then update map or list key
        await b.p(`${repo}.set`, { id,  v: { v: data } });
        return;
    }

    const set = await createVarSetByPath({ bus: b, repo, path, type, _, });
    if (!set) return;

    for (let i = 0; i < set.length; i++) {
        const v = set[i];
        if (v.v) {
            v.v = data;
            if (!v[_].new) v[_].updated = true;
        }
        if (v[_].new || v[_].updated) {
            await b.p(`${repo}.set`, {
                id: v[_].id,
                v: prepareForTransfer(v)
            });
        }
    }

    return set.at(-1);
};