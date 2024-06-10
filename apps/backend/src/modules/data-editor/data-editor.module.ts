import { Module } from '@nestjs/common';
import { DataRepository } from './data.repository';
import { ListTypeController } from './controllers/list-type.controller';
import { DataController } from './controllers/data.controller';
import { MapTypeController } from './controllers/map-type.controller';
import { PlainService } from './service/plain.service';
import { MapService } from './service/map.service';
import { ListService } from './service/list.service';

@Module({
  imports: [],
  controllers: [DataController, MapTypeController, ListTypeController],
  providers: [DataRepository, PlainService, MapService, ListService],
})
export class DataEditorModule {}
