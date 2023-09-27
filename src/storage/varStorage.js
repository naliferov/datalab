export class VarStorage {

    constructor(fs) {
        this.fs = fs;
    }
    async set(id, v) {
        await this.fs.writeFile(`./state/var/${id}`, JSON.stringify(v));
    }
    async get(id) {
        try {
            const data = await this.fs.readFile(`./state/var/${id}`);
            return JSON.parse(data);
        } catch (e) {
            console.log(e.message);
        }
    }
    async del(id) {
        await this.fs.unlink(`./state/var/${id}`);
    }
}