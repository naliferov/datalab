import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
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

  @Put(':id/key')
  async setKey(
    @Param('id') id: string,
    @Body() mapSetKeyDto: MapSetKeyDto,
  ): Promise<DataType> {
    return this.mapService.setKey(id, mapSetKeyDto);
  }

  @Delete(':id/key')
  async delKey(
    @Param('id') id: string,
    @Body('key', ParseStrPipe) key: string,
  ): Promise<ApiResponse> {
    await this.mapService.delKey(id, key);
    return { status: 'success' };
  }
}
