import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import {
  DataType,
  BinaryType,
  PlainType,
  MapType,
  ListType,
} from '../entities/data.type';

@Injectable()
export class DataService {
  constructor(private readonly dataRepository: DataRepository) {}

  isBinaryType(data: unknown): data is BinaryType {
    return typeof data === 'object' && data !== null && 'b' in data;
  }

  isPlainType(data: unknown): data is PlainType {
    return typeof data === 'object' && data !== null && 'v' in data;
  }

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

  isListType(data: unknown): data is ListType {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    if (!('l' in data)) {
      return false;
    }
    return Array.isArray(data.l);
  }

  async setById(id: string, data: DataType): Promise<DataType> {
    await this.dataRepository.set(id, data);
    return data;
  }

  async getById(id: string, depth = 1): Promise<DataType | undefined> {
    const entity = await this.dataRepository.get(id);
    if (!entity) {
      return;
    }
    entity.i = { t: this.getType(entity), id };

    await this.addNestedEntities(entity, depth);
    return entity;
  }

  async delById(id: string): Promise<void> {
    await this.dataRepository.del(id);
  }

  async getVarIds(varId): Promise<string[]> {
    const ids = [varId];

    const getIds = async (v: DataType) => {
      if (this.isBinaryType(v)) {
        ids.push(v.b);
      } else if (this.isMapType(v)) {
        for (const k in v.m) {
          const id = v.m[k] as string;
          ids.push(id);

          const newVar = await this.dataRepository.get(id);
          if (!newVar) {
            continue;
          }
          await getIds(newVar);
        }
      } else if (this.isListType(v)) {
        for (const id of v.l) {
          ids.push(id);

          const newVar = await this.dataRepository.get(id);
          if (!newVar) {
            console.log('newVar not found');
            continue;
          }
          await getIds(newVar);
        }
      }
    };

    const v = await this.dataRepository.get(varId);
    if (!v) {
      return ids;
    }
    await getIds(v);

    return ids;
  }

  private async addNestedEntities(v, depth, fetchVarIds = new Set()) {
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
        if (!nestedV) {
          return;
        }
        nestedV.i = { id, t: this.getType(nestedV) };

        parent[k] = await this.addNestedEntities(
          nestedV,
          depth - 1,
          fetchVarIds,
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
