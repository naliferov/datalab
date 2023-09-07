export class VarRegistry {

    constructor(fs) {
        this.fs = fs;
        this.registry = {};
        this.registryPath = './registry.json';
    }
    async load() {
        if (await this.fs.isExists(this.registryPath)) {
            this.registry = JSON.parse(await this.fs.readFile(this.registryPath));
        }
    }
    list() {
       return Object.keys(this.registry);
    }

    getIdByName(name) {
        return this.registry[name];
    }
    async getObjectById(id, object) {
        const data = await this.fs.readFile(`./var/${id}`);
        return JSON.parse(data);
    }
    async setObject(id, name, o) {
        if (!this.registry[name]) {
            this.registry[name] = id;
            await this.save();
        }
        await this.fs.writeFile(`./var/${id}`, JSON.stringify(o));
    }
    async save() {
        await this.fs.writeFile(this.registryPath, JSON.stringify(this.registry));
    }
}