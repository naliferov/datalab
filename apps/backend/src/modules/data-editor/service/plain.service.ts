import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType, ListType, MapType, PlainType } from '../entities/data.type';

@Injectable()
export class PlainService {
  constructor(private readonly dataRepository: DataRepository) {}

  isPlainType(data: any): data is PlainType {
    return data && data.v !== undefined;
  }

  async setById(id: string, data: DataType): Promise<DataType> {
    await this.dataRepository.set(id, data);
    return data;
  }

  async getById(id: string, depth = 1): Promise<DataType> {
    const entity = await this.dataRepository.get(id);
    if (!entity) {
      return null;
    }

    await this.addNestedEntities(entity, depth);
    return entity;
  }

  async delById(id: string): Promise<void> {
    await this.dataRepository.del(id);
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

  private getVarIds() {}

  private getType(v) {
    if (v.b) return 'b';
    if (v.m) return 'm';
    if (v.l) return 'l';
    if (v.v) return 'v';
    return 'unknown';
  }
}
