class ServerStorage {

    constructor(httpClient) {}

    async getById(path) {
        const resp = await this.httpClient.post('/', { cmd: 'var.get', path: path, depth: 3 });
        const frontend = resp.data;
    }
}