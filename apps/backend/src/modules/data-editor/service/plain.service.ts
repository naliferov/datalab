import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import {
  DataType,
  BinaryType,
  ListType,
  MapType,
  PlainType,
} from '../entities/data.type';
import { MapService } from './map.service';

@Injectable()
export class PlainService {
  constructor(
    private readonly dataRepository: DataRepository,
    private mapService: MapService,
  ) {}

  isBinaryType(data: unknown): data is BinaryType {
    return typeof data === 'object' && 'b' in data && Boolean(data.b);
  }

  isPlainType(data: unknown): data is PlainType {
    return typeof data === 'object' && 'v' in data;
  }

  //async create(data: DataType): Promise<DataType> {
  //let newId = await b.p('getUniqId');
  //}

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

  async getVarIds(varId): Promise<string[]> {
    const ids = [varId];

    const getIds = async (v: DataType) => {
      if (this.isBinaryType(v)) {
        ids.push(v.b);
      } else if (this.mapService.isMapType(v)) {
        for (const k in v.m) {
          const id = v.m[k] as string;
          ids.push(id);

          const newVar = await this.dataRepository.get(id);
          await getIds(newVar);
        }
      } else if (v.l) {
        for (const id of v.l) {
          ids.push(id);

          //find var by id;
          //await getIds();
        }
      }
    };

    const v = await this.dataRepository.get(varId);
    await getIds(v);

    return ids;
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
