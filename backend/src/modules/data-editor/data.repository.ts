import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { DataType } from './entities/data.type';

@Injectable()
export class DataRepository {
  private readonly basePath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'state',
  ); //todo set path here

  //todo add init method for checking if folder exists
  //add logger

  async get(id: string, format = 'json'): Promise<DataType | undefined> {
    const path = `${this.basePath}/${id}`;
    try {
      const data = await fs.readFile(path);

      //unserialize data

      return format === 'json' ? JSON.parse(data.toString()) : data;
    } catch (e) {
      console.error(e.message);
    }
  }

  async set(id: string, data: DataType, format = 'json'): Promise<void> {
    const path = `${this.basePath}/${id}`;

    //serialize data

    const str = format === 'json' ? JSON.stringify(data) : data.toString();
    await fs.writeFile(path, str);
  }

  async del(id: string): Promise<void> {
    const path = `${this.basePath}/${id}`;

    try {
      await fs.unlink(path);
    } catch (e) {
      console.error(e.message);
    }
  }
}
