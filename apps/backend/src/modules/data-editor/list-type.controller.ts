import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { ListEditorService } from './service/list-editor.service';

@Controller('/list')
export class ListTypeController {
  constructor(private readonly listEditorService: ListEditorService) {}

  @Put(':id')
  async listAdd(
    @Param('id') id: string,
    @Body('value') value: string,
  ): Promise<string> {
    return '';
    //return await this.listEditorService.listAdd(id, value);
  }

  @Delete(':id')
  async listDel(
    @Param('id') id: string,
    @Body('key') key: string,
  ): Promise<string> {
    return '';
    //return await this.listEditorService.listDel(id, key);
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
