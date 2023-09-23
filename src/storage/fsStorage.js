export class FsStorage {

    constructor(path, fs) {
        this.path = path;
        this.fs = fs;
    }
    async set(id, o) {
        await this.fs.writeFile(`${this.path}/${id}`, o);
    }
    async get(id) {
        try {
            const data = await this.fs.readFile(`${this.path}/${id}`);
            return JSON.parse(data);
        } catch (e) {
            console.log(e.message);
        }
    }
    async del(id) {
        await this.fs.unlink(`${this.path}/${id}`);
    }
}