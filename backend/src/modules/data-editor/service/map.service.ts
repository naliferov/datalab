import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType } from '../entities/data.type';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { makeUlid } from '../../../common/utils';
import { EntityService } from './entity.service';
import { UnprocessableEntityError } from 'src/common/error/unprocessable-entity-error';

@Injectable()
export class MapService {
  constructor(
    private readonly dataRepository: DataRepository,
    private readonly dataService: EntityService,
  ) {}

  async setKey(id, { key, data }: MapSetKeyDto): Promise<DataType> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new UnprocessableEntityError(`var222 ww with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new UnprocessableEntityError(
        `Invalid type of var found by id [${id}]`,
      );
    }
    if (val.m[key]) {
      throw new UnprocessableEntityError(
        `key [${key}] already exists in map with id [${id}]`,
      );
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

    await this.dataRepository.set(id, val);
  }

  async renameKey(id: string, oldKey: string, newKey: string): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new UnprocessableEntityError(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new UnprocessableEntityError(
        `Invalid type of var found by id [${id}]`,
      );
    }
    if (!val.m[oldKey]) {
      throw new UnprocessableEntityError(`key [${oldKey}] not found in vById`);
    }
    if (val.m[newKey]) {
      throw new UnprocessableEntityError(
        `key [${newKey}] already exists in vById`,
      );
    }

    const oldId = val.m[oldKey];
    val.m[newKey] = oldId;
    delete val.m[oldKey];

    val.o = val.o.map((x) => (x === oldKey ? newKey : x));

    await this.dataRepository.set(id, val);
  }

  async changeOrder(id: string, key: string, newIndex: number): Promise<any> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new UnprocessableEntityError(`var with id [${id}] not found`);
    }
    if (!this.dataService.isMapType(val)) {
      throw new UnprocessableEntityError(
        `Invalid type of var found by id [${id}]`,
      );
    }
    if (newIndex < 0 || newIndex >= val.o.length) {
      throw new UnprocessableEntityError('Invalid index');
    }

    const oldIndex = val.o.indexOf(key);
    if (oldIndex === -1) {
      throw new UnprocessableEntityError(`key [${key}] not found in vById`);
    }
    val.o.splice(oldIndex, 1);
    val.o.splice(newIndex, 0, key);

    await this.dataRepository.set(id, val);
  }
}
