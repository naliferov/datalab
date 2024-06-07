import { Module } from '@nestjs/common';
import { DataRepository } from './data.repository';
import { ListTypeController } from './list-type.controller';
import { PlainTypeController } from './plain-type.controller';
import { MapTypeController } from './map-type.controller';
import { PlainEditorService } from './service/plain-editor.service';
import { MapEditorService } from './service/map-editor.service';
import { ListEditorService } from './service/list-editor.service';

@Module({
  imports: [],
  controllers: [PlainTypeController, MapTypeController, ListTypeController],
  providers: [
    DataRepository,
    PlainEditorService,
    MapEditorService,
    ListEditorService,
  ],
})
export class DataEditorModule {}
