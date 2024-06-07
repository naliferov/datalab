import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { DataEditorEntity } from './entities/data.type';

@Injectable()
export class DataRepository {
  private readonly basePath = path.resolve(__dirname, '..', 'state');

  async get(id: string, format = 'json'): Promise<DataEditorEntity> {
    const path = `${this.basePath}/${id}`;

    try {
      const data = await fs.readFile(path);
      return format === 'json' ? JSON.parse(data.toString()) : data;
    } catch (e) {
      console.log(e.message);
    }
  }

  async set(
    id: string,
    data: DataEditorEntity,
    format = 'json',
  ): Promise<void> {
    const path = `${this.basePath}/${id}`;

    const str = format === 'json' ? JSON.stringify(data) : data.toString();
    await fs.writeFile(path, str);
  }

  async del(id: string): Promise<void> {
    const path = `${this.basePath}/${id}`;
    await fs.unlink(path);
  }

  // const { id } = x.del;
  //     const path = `${statePath}/${id}`;

  //     return b.p('fs', { del: { path } });
}
