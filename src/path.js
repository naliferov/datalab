export class Path {
    constructor(pathArr) {
        this.arr = pathArr;
    }
    toArr() { return this.arr }
    toDirPath() {
        if (this.arr.length <= 1) return;
        return new Path(this.arr.slice(0, -1));
    }
    toStr() { return this.arr.join('/'); }
}