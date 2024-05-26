import { Controller, Get, Post } from '@nestjs/common';
import { DataEditorService } from './data-editor.service';

@Controller('/data-editor')
export class DataEditorController {
  constructor(private readonly dataEditorService: DataEditorService) {}

  @Get('get-by-path')
  async getByPath(): Promise<string> {
    return await this.dataEditorService.getByPath();
  }

  @Post('set-value')
  async setValue(): Promise<string> {
    return await this.dataEditorService.setValue();
  }

  @Post('change-order')
  async index(): Promise<string> {
    return await this.dataEditorService.changeOrder();
  }
}
