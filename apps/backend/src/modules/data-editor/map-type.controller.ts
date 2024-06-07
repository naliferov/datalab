import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { MapEditorService } from './service/map-editor.service';
import { DataEditorEntity } from './entities/data.type';

@Controller('/map')
export class MapTypeController {
  constructor(private readonly dataMapService: MapEditorService) {}

  @Get(':id')
  async getMapById(@Param('id') mapId: string): Promise<any> {
    //return await this.dataMapService.getMapById(mapId);
  }

  @Put(':id/key')
  async setOrUpdateMapKey(
    @Param('id') mapId: string,
    @Body('key') key: string,
    @Body('data') data: DataEditorEntity,
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
