import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { MapService } from '../service/map.service';
import { DataType } from '../entities/data.type';
import { PlainService } from '../service/plain.service';

@Controller('/data/map')
export class MapTypeController {
  constructor(
    private readonly plainService: PlainService,
    private readonly mapService: MapService,
  ) {}

  @Get(':id')
  async getMapById(@Param('id') mapId: string): Promise<any> {
    //return await this.dataMapService.getMapById(mapId);
  }

  @Put(':id/key')
  async setOrUpdateMapKey(
    @Param('id') mapId: string,
    @Body('key') key: string,
    @Body('data') data: DataType,
  ): Promise<string> {
    return '';
    //return await this.dataMapService.setOrUpdateMapKey(mapId, key, data);
  }

  @Delete(':id/key')
  async delMapKey(
    @Param('id') mapId: string,
    @Body('key') key: string,
  ): Promise<string> {
    return '';
    //return await this.dataMapService.delMapKey(mapId, key);
  }

  @Put(':id/change-order')
  async changeType(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }
}
