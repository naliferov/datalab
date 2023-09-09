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
    getVarIdByName(name) {
        return this.registry[name];
    }

    async getObjectById(id) {
        const data = await this.fs.readFile(`./var/${id}`);
        return JSON.parse(data);
    }
    async setObjectById(id, data) {
        await this.fs.writeFile(`./var/${id}`, JSON.stringify(data));
    }
    async setObject(id, name, data) {
        if (!this.registry[name]) {
            this.registry[name] = id;
            await this.save();
        }
        await this.setObjectById(id, data);
    }

    async delete(o) {
        if (this.registry[o.name]) {
            delete this.registry[o.name];
            await this.save();
        }
        await this.fs.unlink(`./var/${o.id}`);
    }
    async save() {
        await this.fs.writeFile(this.registryPath, JSON.stringify(this.registry));
    }
}