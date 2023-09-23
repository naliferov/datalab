export class VarRepository {

    constructor(varStorage, varRelationRepository) {
        this.varStorage = varStorage;
        this.varRelationRepository = varRelationRepository;
    }

    async getByPath(path) {
        if (path[0] === 'root') return {};

        let relation = await this.getById('root');
        let entity;

        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            if (!name) return;
            if (!relation.assoc) return;

            const id = relation.assoc[name];
            if (!id) return;
            entity = await this.getById(id);
            if (!entity) return;

            if (i !== path.length - 1) {
                relation = entity;
            }
        }

        return { relation, entity };
    }

    async getById(id) {
        return await this.varStorage.get(id);
    }
}