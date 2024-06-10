import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ListService } from '../service/list.service';

@Controller('/data/list')
export class ListTypeController {
  constructor(private readonly listService: ListService) {}
  @Post(':id')
  async changeType(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }

  @Delete(':id/remove')
  async delete(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }

  @Put(':id/change-order')
  async changeOrder(@Param('id') id: string): Promise<any> {
    //type
    //await this.plainEditorService.delById(id);
    return {
      message: 'success',
    };
  }
}
