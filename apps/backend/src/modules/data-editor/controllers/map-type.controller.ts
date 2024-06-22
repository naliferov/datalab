import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { MapService } from '../service/map.service';
import { PlainService } from '../service/plain.service';
import { MapSetKeyDto } from '../dto/map-set-key.dto';
import { DataType } from '../entities/data.type';

@Controller('/data/map')
export class MapTypeController {
  constructor(
    private readonly plainService: PlainService,
    private readonly mapService: MapService,
  ) {}

  @Put(':id/key')
  async setMapKey(
    @Param('id') id: string,
    @Body() mapSetKeyDto: MapSetKeyDto,
  ): Promise<DataType> {
    return this.mapService.setKey(id, mapSetKeyDto);
  }

  @Delete(':id/key')
  async delKey(
    @Param('id') mapId: string,
    @Body('key') key: string,
  ): Promise<string> {
    return '';
    //return await this.mapService.delMapKey(mapId, key);
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
