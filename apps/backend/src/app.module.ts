import { Module } from '@nestjs/common';
import { DataEditorModule } from './modules/data-editor/data-editor.module';
@Module({
  imports: [DataEditorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
