import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType } from '../entities/data.type';
import { DataService } from './data.service';
import { makeUlid } from '../../../common/utils';

@Injectable()
export class ListService {
  constructor(
    private readonly dataRepository: DataRepository,
    private readonly dataService: DataService,
  ) {}

  async add(id: string, data: DataType): Promise<DataType | undefined> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isListType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }

    //todo validateData
    const newId = makeUlid();
    val.l.push(newId);

    await this.dataRepository.set(newId, data);
    await this.dataRepository.set(id, val);

    return val;
  }

  async del(id, index: number): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isListType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (!val.l[index]) {
      throw new Error(`index [${index}] not found in value by id [${id}]`);
    }

    const idOfIndex = val.l[index];

    const varIds = await this.dataService.getVarIds(idOfIndex);
    for (const id of varIds) {
      await this.dataRepository.del(id);
    }

    val.l.splice(index, 1);
    this.dataRepository.set(id, val);
  }

  async changeOrder(
    id: string,
    oldIndex: number,
    newIndex: number,
  ): Promise<void> {
    const val = await this.dataRepository.get(id);
    if (!val) {
      throw new Error(`var with id [${id}] not found`);
    }
    if (!this.dataService.isListType(val)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }
    if (oldIndex < 0 || oldIndex >= val.l.length) {
      throw new Error(`Invalid old index [${oldIndex}]`);
    }
    if (newIndex < 0 || newIndex >= val.l.length) {
      throw new Error(`Invalid new index [${newIndex}]`);
    }

    const varId = val.l.splice(oldIndex, 1)[0];
    val.l.splice(newIndex, 0, varId);

    await this.dataRepository.set(id, val);
  }
}
