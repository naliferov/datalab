import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpEndpointService {
  getHello(): string {
    return 'Hello World!';
  }
}
