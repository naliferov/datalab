export class VarFactory {

    constructor(ulid, repository) {
        this.ulid = ulid;
        this.repository = repository;
    }

    createNewVar(createDataVar) {
        const v = createDataVar ? { data: '_stub_' } : { map: {} };
        v.id = this.ulid();
        v.new = true;
        return v;
    }

    async createByPath(path) {

        let v1 = await this.repository.getById('root');
        v1.id = 'root';
        let set = [v1];

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;

            const v1 = set.at(-1);
            let v2;

            let id = v1.map[name];
            if (id) {
                v2 = await this.repository.getById(id);
                v2.id = id;
                //todo v2.data or (v2.map or v2.list)
                v2.transaction = {
                    id: this.ulid(),
                    op: '_stub_',
                    path: '',
                    //oldVal: ,
                    //newVal: ''
                };
            }
            if (!v2) {
                v2 = this.createNewVar(i === path.length - 1);
                v2.transaction = {
                    id: this.ulid(),
                    op: 'set',
                    path: '',
                    newVal: ''
                };

                v1.map[name] = v2.id;
                v1.updated = 1;
            }
            v2.name = name;

            set.push(v2);
        }

        return set;
    }
}