import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType, MapType } from '../entities/data.type';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { makeUlid } from 'apps/backend/src/common/utils';
import { find, map } from 'rxjs';

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

  async delKey(id: string, key: string): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.isMapType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (!val.m[key]) {
      throw new Error(`key [${key}] not found in vById`);
    }

    const oldId = val.m[key];
    const varIds = await this.getVarIds(oldId);
    for (const id of varIds) {
      console.log(id);
      //await this.dataRepository.del(id);
    }

    delete val.m[key];
    val.o = val.o.filter((x) => x !== key);

    //this.dataRepository.set(id, val);
  }

  changeOrder(): string {
    return '';
  }
}
