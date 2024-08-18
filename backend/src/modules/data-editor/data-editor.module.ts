import { Module } from '@nestjs/common';
import { DataRepository } from './data.repository';
import { ListController } from './controllers/list.controller';
import { DataController } from './controllers/data.controller';
import { MapController } from './controllers/map.controller';
import { DataService } from './service/data.service';
import { MapService } from './service/map.service';
import { ListService } from './service/list.service';

@Module({
  imports: [],
  controllers: [DataController, MapController, ListController],
  providers: [DataRepository, DataService, MapService, ListService],
})
export class DataEditorModule {}
