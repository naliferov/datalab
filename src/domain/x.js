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