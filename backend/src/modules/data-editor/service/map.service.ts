import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType } from '../entities/data.type';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { makeUlid } from '../../../common/utils';
import { EntityService } from './entity.service';

@Injectable()
export class MapService {
  constructor(
    private readonly dataRepository: DataRepository,
    private readonly dataService: EntityService,
  ) {}

  // async validateData(data) {
  // }

  async setKey(id, { key, data }: MapSetKeyDto): Promise<DataType> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
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
    return val;
  }

  async delKey(id: string, key: string): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (!val.m[key]) {
      throw new Error(`key [${key}] not found in vById`);
    }

    const oldId = val.m[key];
    const varIds = await this.dataService.getVarIds(oldId);
    for (const id of varIds) {
      await this.dataRepository.del(id);
    }

    delete val.m[key];
    val.o = val.o.filter((x) => x !== key);

    this.dataRepository.set(id, val);
  }

  async renameKey(id: string, oldKey: string, newKey: string): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (!val.m[oldKey]) {
      throw new Error(`key [${oldKey}] not found in vById`);
    }
    if (val.m[newKey]) {
      throw new Error(`key [${newKey}] already exists in vById`);
    }

    const oldId = val.m[oldKey];
    val.m[newKey] = oldId;
    delete val.m[oldKey];

    val.o = val.o.map((x) => (x === oldKey ? newKey : x));

    this.dataRepository.set(id, val);
  }

  async changeOrder(id: string, key: string, newIndex: number): Promise<any> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (newIndex < 0 || newIndex >= val.o.length) {
      throw new Error('Invalid index');
    }

    const oldIndex = val.o.indexOf(key);
    if (oldIndex === -1) {
      throw new Error(`key [${key}] not found in vById`);
    }
    val.o.splice(oldIndex, 1);
    val.o.splice(newIndex, 0, key);

    this.dataRepository.set(id, val);
  }
}
