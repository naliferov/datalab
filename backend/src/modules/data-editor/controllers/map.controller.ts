import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { MapService } from '../service/map.service';
import { DataService } from '../service/data.service';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { DataType } from '../entities/data.type';
import { ParseStrPipe } from '../../../common/pipe/parse-str.pipe';
import { ApiResponse } from '../../../common/api-response';

@Controller('/data/map')
export class MapController {
  constructor(
    private readonly dataService: DataService,
    private readonly mapService: MapService,
  ) {}

  @Put('key/:id')
  async setKey(
    @Param('id') id: string,
    @Body() mapSetKeyDto: MapSetKeyDto,
  ): Promise<ApiResponse<DataType>> {
    return {
      status: 'success',
      data: await this.mapService.setKey(id, mapSetKeyDto),
    };
  }

  @Delete('key/:id')
  async delKey(
    @Param('id') id: string,
    @Body('key', ParseStrPipe) key: string,
  ): Promise<ApiResponse> {
    await this.mapService.delKey(id, key);
    return { status: 'success' };
  }

  @Put('rename-key/:id')
  async renameKey(
    @Param('id') id: string,
    @Body('oldKey', ParseStrPipe) oldKey: string,
    @Body('newKey', ParseStrPipe) newKey: string,
  ): Promise<ApiResponse> {
    await this.mapService.renameKey(id, oldKey, newKey);
    return { status: 'success' };
  }

  @Put('change-order/:id')
  async changeOrder(
    @Param('id') id: string,
    @Body('key', ParseStrPipe) key: string,
    @Body('index', ParseIntPipe) newIndex: number,
  ): Promise<ApiResponse> {
    await this.mapService.changeOrder(id, key, newIndex);
    return { status: 'success' };
  }
}
