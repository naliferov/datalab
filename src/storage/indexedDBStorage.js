export class IndexedDBStorage {

    constructor(db) {
        this.db = db;
    }
    async set(id, v) {

        let transaction = this.db.transaction('vars', 'readwrite');
        let vars = transaction.objectStore('vars');

        let request = vars.put(v, id);
        request.onsuccess = () => {
            console.log("Var added to the store", request.result);
        };
        request.onerror = () => {
            console.log("Error", request.error);
        };
    }
    async get(id) {
        // try {
        //     const data = await this.fs.readFile(`${this.path}/${id}`);
        //     return JSON.parse(data);
        // } catch (e) {
        //     console.log(e.message);
        // }
    }
    async del(id) {
        //await this.fs.unlink(`${this.path}/${id}`);
    }
}