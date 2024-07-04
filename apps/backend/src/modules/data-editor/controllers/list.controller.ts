import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ListService } from '../service/list.service';
import { DataType } from '../entities/data.type';
import { ParseStrPipe } from 'apps/backend/src/common/pipe/parse-str.pipe';

@Controller('/data/list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Put(':id')
  async add(
    @Param('id') id: string,
    @Body('data') data: DataType,
  ): Promise<any> {
    await this.listService.add(id, data);
    return {
      message: 'success',
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('index', ParseIntPipe) index: number,
  ): Promise<unknown> {
    await this.listService.del(id, index);
    return {
      message: 'success',
    };
  }

  @Put('change-order/:id')
  async changeOrder(
    @Param('id') id: string,
    @Body('oldIndex') oldIndex: number,
    @Body('newIndex') newIndex: number,
  ): Promise<any> {
    await this.listService.changeOrder(id, oldIndex, newIndex);
    return {
      message: 'success',
    };
  }
}
