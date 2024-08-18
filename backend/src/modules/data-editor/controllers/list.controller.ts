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
import { ApiResponse } from '../../../common/api-response';

@Controller('/data/list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Put(':id')
  async add(
    @Param('id') id: string,
    @Body('data') data: DataType,
  ): Promise<ApiResponse<DataType>> {
    const list = await this.listService.add(id, data);
    return {
      status: 'success',
      data: list,
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('index', ParseIntPipe) index: number,
  ): Promise<ApiResponse> {
    await this.listService.del(id, index);
    return {
      status: 'success',
    };
  }

  @Put('change-order/:id')
  async changeOrder(
    @Param('id') id: string,
    @Body('oldIndex') oldIndex: number,
    @Body('newIndex') newIndex: number,
  ): Promise<ApiResponse> {
    await this.listService.changeOrder(id, oldIndex, newIndex);
    return {
      status: 'success',
    };
  }
}
