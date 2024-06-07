import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataEditorEntity } from '../entities/data.type';

@Injectable()
export class MapEditorService {
  constructor(private readonly dataRepository: DataRepository) {}

  async setMapKey(mapId, key, data: DataEditorEntity): Promise<string> {
    const map = await this.dataRepository.get(mapId);

    //if (map.m[key]) return { msg: `k [${k}] already exists in vById` };
    //if (!vById.o) return { msg: `v.o is not found by [${id}]` };
    //if (ok === undefined) return { msg: `ok is empty` };

    //data.m[key] = id;
    //data.o.splice(ok, 0, k);
    //data.o.push(key);

    //await this.dataRepository.set(id, data);
    //await b.p('repo', { set: { id: newId, v } });
    //await b.p('repo', { set: { id, v: vById } });

    return '';
  }

  async delKey(mapId, key): Promise<string> {
    //const map = await this.dataRepository.get(mapId);
    return '';
  }

  changeOrder(): string {
    return '';
  }

  private async addNestedEntities(
    v,
    depth,
    fetchVarIds = new Set(),
    getMeta = false,
  ) {
    if (!v.i) {
      v.i = { t: this.getType(v) };
    }

    const isNeedGetVar = Boolean(fetchVarIds && v.i && fetchVarIds.has(v.i.id));
    if (!isNeedGetVar && depth <= 0) {
      if (v.m || v.l) {
        if (v.i) {
          v.i.openable = true;
        }
        return v;
      }
    }

    if (v.l || v.m) {
      await this.iterate(v, async (parent, k, id) => {
        const nestedV = await this.dataRepository.get(id);
        nestedV.i = { id, t: this.getType(nestedV) };

        parent[k] = await this.addNestedEntities(
          nestedV,
          depth - 1,
          fetchVarIds,
          getMeta,
        );
      });
    }

    return v;
  }

  private async iterate(v, cb) {
    if (v.l) {
      for (let k = 0; k < v.l.length; k++) {
        await cb(v.l, k, v.l[k]);
      }
    } else if (v.m) {
      for (const k in v.m) {
        await cb(v.m, k, v.m[k]);
      }
    }
  }

  private getType(v) {
    if (v.b) return 'b';
    if (v.m) return 'm';
    if (v.l) return 'l';
    if (v.v) return 'v';
    return 'unknown';
  }
}
