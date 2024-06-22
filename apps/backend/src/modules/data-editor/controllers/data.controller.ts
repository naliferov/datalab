import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DataType } from '../entities/data.type';
import { PlainService } from '../service/plain.service';
import { MapService } from '../service/map.service';
import { ListService } from '../service/list.service';
import { ApiResponse } from '../../../common/api-response';

@Controller('/data')
export class DataController {
  constructor(
    private readonly plainTypeService: PlainService,
    private readonly mapTypeService: MapService,
    private readonly listTypeService: ListService,
  ) {}

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query('depth', new DefaultValuePipe(1), ParseIntPipe) depth, //todo add parameter name to error message
  ): Promise<ApiResponse<DataType>> {
    return {
      status: 'success',
      data: await this.plainTypeService.getById(id, depth),
    };
  }

  @Put(':id')
  async setById(
    @Param('id') id: string,
    @Body('data') data: DataType,
  ): Promise<ApiResponse<DataType>> {
    return {
      status: 'success',
      data: await this.plainTypeService.setById(id, data),
    };
  }

  @Delete(':id')
  async delById(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.plainTypeService.getById(id);
    if (!data) {
      return {
        status: 'fail',
        errors: [{ message: 'data for delete not found' }],
      };
    }

    if (this.plainTypeService.isPlainType(data)) {
      this.plainTypeService.delById(id);
      return { status: 'success' };
    }

    // if (this.mapTypeService.isMapType(data)) {
    //   this.mapTypeService.delById(id);
    //   return { status: 'success' };
    // }

    // if (this.listTypeService.isListType(data)) {
    //   this.mapTypeService.delById(id);
    //   return { status: 'success' };
    // }

    return { status: 'fail', errors: [] };
  }

  //maybe use setById instead, but add validation for type, and if i replace map, need to delete all items
  //todo also need add garbage collection for tree
  // @Put(':id/change-type')
  // async changeType(@Param('id') id: string): Promise<any> {
  //   await this.plainTypeService.delById(id);
  //   return {
  //     message: 'success',
  //   };
  // }

  // @Put(':id/copy')
  // async copy(@Param('id') id: string): Promise<any> {
  //   //type
  //   //await this.plainEditorService.delById(id);
  //   return {
  //     message: 'success',
  //   };
  // }

  // @Put(':id/move')
  // async move(@Param('id') id: string): Promise<any> {
  //   //type
  //   //await this.plainEditorService.delById(id);
  //   return {
  //     message: 'success',
  //   };
  // }
}
