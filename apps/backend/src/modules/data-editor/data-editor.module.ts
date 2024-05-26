import { Module } from '@nestjs/common';
import { DataEditorController } from './data-editor.controller';
import { DataEditorService } from './data-editor.service';

@Module({
  imports: [],
  controllers: [DataEditorController],
  providers: [DataEditorService],
})
export class DataEditorModule {}
