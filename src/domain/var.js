export class Var {
    id;
    meta;
    //parentRelation; //parentId, name of this var in parent vars
    methods = {
        'setData': {},
        'set': {},
        'get': {},
        'del': {},
        'addRelation': {},
        //'addHorizontalRelation'
    }
}

export class VarMeta {
    name;
    creationTime;
}

export class VarRelation {
    idA
}