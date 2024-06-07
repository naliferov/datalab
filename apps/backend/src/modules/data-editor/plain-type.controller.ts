import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DataEditorEntity } from './entities/data.type';
import { PlainEditorService } from './service/plain-editor.service';

@Controller('/data/plain-type')
export class PlainTypeController {
  constructor(private readonly plainEditorService: PlainEditorService) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<DataEditorEntity> {
    return await this.plainEditorService.getById(id);
  }

  @Put(':id')
  async setById(
    @Param('id') id: string,
    @Body() data: DataEditorEntity,
  ): Promise<DataEditorEntity> {
    return await this.plainEditorService.setById(id, data);
  }

  @Delete(':id')
  async delById(@Param('id') id: string): Promise<any> {
    await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }

  @Put(':id/change-type')
  async changeType(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }

  @Put(':id/move')
  async move(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }

  @Put(':id/move')
  async copy(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }
}
