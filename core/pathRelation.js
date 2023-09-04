class PathRelation {

    constructor(pathArr) {
        this.arr = pathArr;
    }
    toArr() { return this.arr }
    toDirPath() {
        if (this.arr.length <= 1) return;
        return new PathRelation(this.arr.slice(0, -1));
    }
    //toFsPath() { return new PathRelation(['state', ...this.arr]) }
    toStr() { return this.arr.join('/'); }
}

export const createPathRelationFactory = (pathToArray) => {

    return (path) => {
        const pathArr = pathToArray(path ? path : '*');
        const relation = new PathRelation(pathArr);
        return relation;
    }
}