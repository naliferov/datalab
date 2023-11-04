export const X = (symbol) => {

    let _ = symbol;
    const f = {};

    return async (x) => {
        if (x[_].x) {
            return await f[x[_].x](x);
        }
        if (x[_].y) {
            f[x[_].y] = x[_].f;
        }
    }
}

export const b = {
    setX(x) {
        this.x = x;
    },
    set_(_) {
        this._ = _;
    },
    async p(e, data) {
        const _ = this._;
        return await this.x({ [_]: { x: e }, ...data });
    },
    async s(e, f) {
        const _ = this._;
        await this.x({ [_]: { y: e, f } });
    },
}