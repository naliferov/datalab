import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import {
  DataType,
  BinaryType,
  PrimitiveType,
  MapType,
  ListType,
} from '../entities/data.type';

@Injectable()
export class EntityService {
  constructor(private readonly dataRepository: DataRepository) {}

  isBinaryType(data: unknown): data is BinaryType {
    return typeof data === 'object' && data !== null && 'b' in data;
  }

  isPrimitiveType(data: unknown): data is PrimitiveType {
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
    entity.meta = { id, type: this.getType(entity) };

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
        ids.push(v.binary);
      } else if (this.isMapType(v)) {
        for (const k in v.map) {
          const id = v.map[k] as string;
          ids.push(id);

          const newVar = await this.dataRepository.get(id);
          if (!newVar) {
            continue;
          }
          await getIds(newVar);
        }
      } else if (this.isListType(v)) {
        for (const id of v.list) {
          ids.push(id);

          const newVar = await this.dataRepository.get(id as string);
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

  private async addNestedEntities(v: any, depth, fetchVarIds = new Set()) {
    const isNeedGetVar = Boolean(
      fetchVarIds && v.meta && fetchVarIds.has(v.meta.id),
    );
    if (!isNeedGetVar && depth <= 0) {
      if (v.map || v.list) {
        if (v.meta) {
          v.meta.openable = true;
        }
        return v;
      }
    }

    if (v.list || v.list) {
      await this.iterate(v, async (parent, k, id) => {
        const nestedV = await this.dataRepository.get(id);
        if (!nestedV) {
          return;
        }
        nestedV.meta = { id, type: this.getType(nestedV) };

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
    if (v.list) {
      for (let k = 0; k < v.list.length; k++) {
        await cb(v.list, k, v.list[k]);
      }
    } else if (v.map) {
      for (const k in v.map) {
        await cb(v.map, k, v.map[k]);
      }
    }
  }

  private getType(v) {
    if (v.binary) return 'binary';
    if (v.map) return 'map';
    if (v.list) return 'list';
    if (v.value) return 'value';
    return 'unknown';
  }
}
