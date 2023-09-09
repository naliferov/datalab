export class VarStorage {

    constructor(fs) {
        this.fs = fs;
    }
    serialize(u) {
        const o = {}
        if (u.data) o.data = u.data;
        if (u.vars) o.vars = u.vars;
        return o;
    }
    async get(id) {
        try {
            const data = await this.fs.readFile(`./var/${id}`);
            return JSON.parse(data);
        } catch (e) {
            console.log(e.message);
        }
    }
    async set(id, u) {
        await this.fs.writeFile(`./var/${id}`, JSON.stringify(this.serialize(u)));
    }
    async del(id) {
        await this.fs.unlink(`./var/${o.id}`);
    }
}