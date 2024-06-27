import { Injectable } from '@nestjs/common';
import { DataRepository } from '../data.repository';
import { DataType } from '../entities/data.type';

@Injectable()
export class ListService {
  constructor(private readonly dataRepository: DataRepository) {}

  async add(mapId, key, data: DataType): Promise<string> {
    const map = await this.dataRepository.get(mapId);

    //if (map.m[key]) return { msg: `k [${k}] already exists in vById` };
    //if (!vById.o) return { msg: `v.o is not found by [${id}]` };
    //if (ok === undefined) return { msg: `ok is empty` };

    //data.m[key] = id;
    //data.o.splice(ok, 0, k);
    //data.o.push(key);

    //await this.dataRepository.set(id, data);
    //await b.p('repo', { set: { id: newId, v } });
    //await b.p('repo', { set: { id, v: vById } });

    return '';
  }

  async del(mapId, key): Promise<string> {
    //const map = await this.dataRepository.get(mapId);
    return '';
  }

  changeOrder(): string {
    return '';
  }
}
