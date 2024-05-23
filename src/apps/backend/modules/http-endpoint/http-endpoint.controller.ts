import { Controller, Get } from '@nestjs/common';
import { HttpEndpointService } from './http-endpoint.service';

@Controller()
export class HttpEndpointController {
  constructor(private readonly httpEndpointService: HttpEndpointService) {}

  @Get()
  getHello(): string {
    return this.httpEndpointService.getHello();
  }
}
