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
    if (val.map[key]) {
      throw new UnprocessableEntityError(
        `key [${key}] already exists in map with id [${id}]`,
      );
    }

    //todo validateData

    const newId = makeUlid();
    val.map[key] = newId;
    val.order.push(key);

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
    if (!val.map[key]) {
      throw new Error(`key [${key}] not found in vById`);
    }

    const oldId = val.map[key];
    const varIds = await this.dataService.getVarIds(oldId);
    for (const id of varIds) {
      await this.dataRepository.del(id);
    }

    delete val.map[key];
    val.order = val.order.filter((x) => x !== key);

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
    if (!val.map[oldKey]) {
      throw new UnprocessableEntityError(`key [${oldKey}] not found in vById`);
    }
    if (val.map[newKey]) {
      throw new UnprocessableEntityError(
        `key [${newKey}] already exists in vById`,
      );
    }

    const oldId = val.map[oldKey];
    val.map[newKey] = oldId;
    delete val.map[oldKey];

    val.order = val.order.map((x) => (x === oldKey ? newKey : x));

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
    if (newIndex < 0 || newIndex >= val.order.length) {
      throw new UnprocessableEntityError('Invalid index');
    }

    const oldIndex = val.order.indexOf(key);
    if (oldIndex === -1) {
      throw new UnprocessableEntityError(`key [${key}] not found in vById`);
    }
    val.order.splice(oldIndex, 1);
    val.order.splice(newIndex, 0, key);

    await this.dataRepository.set(id, val);
  }
}
