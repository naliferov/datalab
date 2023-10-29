export const x = async (b) => {

    const _ = await b.p('get_'); //todo implement sub for this

    return async (x) => {
        if (x[_].x === 'o') await b.p(x[_].e, x);
        if (x[_].x === 'i') await b.s(x[_].e, x);
    }
}