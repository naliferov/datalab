import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType, MapType } from '../entities/data.type';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { makeUlid } from 'apps/backend/src/common/utils';

@Injectable()
export class MapService {
  constructor(private readonly dataRepository: DataRepository) {}

  isMapType(data: DataType): data is MapType {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    if (!('m' in data) || !('o' in data)) {
      return false;
    }

    return (
      typeof data.m === 'object' && data.m !== null && Array.isArray(data.o)
    );
  }

  // async validateData(data) {
  // }

  async setKey(id, { key, data }: MapSetKeyDto): Promise<DataType | undefined> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.isMapType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (val.m[key]) {
      throw new Error(`key [${key}] already exists in vById`);
    }

    //todo validateData

    const newId = makeUlid();
    val.m[key] = newId;
    val.o.push(key);

    await this.dataRepository.set(newId, data);
    await this.dataRepository.set(id, val);
    return;
  }

  async delKey(mapId, key): Promise<string> {
    //const map = await this.dataRepository.get(mapId);
    return '';
  }

  async delById(id: string) {}

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
