import { Module } from '@nestjs/common';
import { DataRepository } from './data.repository';
import { ListController } from './controllers/list.controller';
import { EntityController } from './controllers/enitity.controller';
import { MapController } from './controllers/map.controller';
import { EntityService } from './service/entity.service';
import { MapService } from './service/map.service';
import { ListService } from './service/list.service';

@Module({
  imports: [],
  controllers: [EntityController, MapController, ListController],
  providers: [DataRepository, EntityService, MapService, ListService],
})
export class DataEditorModule {}
