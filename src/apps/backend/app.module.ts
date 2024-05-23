import { Module } from '@nestjs/common';
import { HttpEndpointModule } from './modules/http-endpoint/http-endpoint.module';

@Module({
  imports: [HttpEndpointModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
