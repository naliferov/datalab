export class NetStorage {

    constructor(bus) {
        this.bus = bus;
    }
    async set(id, v) {
        //await this.fs.writeFile(`${this.path}/${id}`, JSON.stringify(v));
    }
    async get(id) {
        try {
            //const data = await this.fs.readFile(`${this.path}/${id}`);
            //return JSON.parse(data);
        } catch (e) {
            //console.log(e.message);
        }
    }
    async del(id) {
        //await this.fs.unlink(`${this.path}/${id}`);
    }
}