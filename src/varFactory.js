export class VarFactory {

    constructor(ulid, repository) {
        this.ulid = ulid;
        this.repository = repository;
    }

    createNewVar(createDataVar) {
        const v = createDataVar ? { data: '' } : { assoc: {} };

        v.id = this.ulid();
        v.new = true;
        return v;
    }

    async createByPath(path) {

        let relation = [ await this.repository.getById('root') ];
        let last = relation.at(-1);

        //console.log()
        return;

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;
            const isLastIteration = i === path.length - 1;

            if (varA.assoc) {
                let id = varA.assoc[name];
                if (id) {
                    varB = await this.repository.getById(id);
                    if (varB) varB.id = id;
                } else {
                    varB = null;
                }
            }

            if (!varB) {
                varB = this.createNewVar(isLastIteration);
                varA.assoc[name] = varB.id;
                //update varA
            }

            if (isLastIteration) {
                //if (entity.assoc) return;
                if (varB.new) {
                    //await this.repository.save(entity.id, {data: entity.assoc});
                }
                return { varA, varB };
            }

            //if (entity.new) {
                //await this.repository.save(entity.id, {assoc: entity.assoc});
            //}
            varA = varB;
        }

    }
}