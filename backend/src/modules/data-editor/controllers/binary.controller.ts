import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { DataType } from '../entities/data.type';
import { EntityService } from '../service/entity.service';
import { ApiResponse } from '../../../common/api-response';

@Controller('/data/entity')
export class BinaryController {
  constructor(private readonly dataService: EntityService) {}

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query('depth', new DefaultValuePipe(1), ParseIntPipe) depth, //todo add parameter name to error message
  ): Promise<ApiResponse<DataType>> {
    return {
      status: 'success',
      data: await this.dataService.getById(id, depth),
    };
  }

  @Put(':id')
  async setById(
    @Param('id') id: string,
    @Body('data') data: DataType,
  ): Promise<ApiResponse<DataType>> {
    //todo validate data
    return {
      status: 'success',
      data: await this.dataService.setById(id, data),
    };
  }

  @Delete(':id')
  async delById(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.dataService.getById(id);
    if (!data) {
      return {
        status: 'fail',
        errors: [{ message: 'data for delete not found' }],
      };
    }

    if (!this.dataService.isPrimitiveType(data)) {
      throw new Error(`Invalid type of var found by id [${id}]`);
    }

    this.dataService.delById(id);
    return { status: 'success' };
  }
}
