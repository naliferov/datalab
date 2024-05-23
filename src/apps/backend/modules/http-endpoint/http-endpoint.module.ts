import { Module } from '@nestjs/common';
import { HttpEndpointController } from './http-endpoint.controller';
import { HttpEndpointService } from './http-endpoint.service';

@Module({
  imports: [],
  controllers: [HttpEndpointController],
  providers: [HttpEndpointService],
})
export class HttpEndpointModule {}
