export class IndexedDb {

    open() {
        return new Promise((resolve, reject) => {

            const openRequest = indexedDB.open('varcraft');
            openRequest.onerror = () => {
                reject(openRequest.error);
            };
            openRequest.onsuccess = () => {
                this.db = openRequest.result;
                resolve(this.db);
            };
            openRequest.onupgradeneeded = () => {
                let db = openRequest.result;
                if (!db.objectStoreNames.contains('vars')) {
                    db.createObjectStore('vars');
                }
            };
        });
    }

    async set(id, v) {
        const t = this.db.transaction('vars', 'readwrite');
        const vars = t.objectStore('vars');

        const rq = vars.put(v, id);
        rq.onsuccess = () => {
            return rq.result;
        }
        rq.onerror = () => {
            return rq.error;
        }
    }

    async get(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction('vars', 'readonly');
            const vars = transaction.objectStore('vars');
            const rq = vars.get(id);
            rq.onsuccess = () => {
                resolve(rq.result);
            };
            rq.onerror = () => {
                reject(rq.error);
            };
        });
    }

    async del(id) {

    }
}