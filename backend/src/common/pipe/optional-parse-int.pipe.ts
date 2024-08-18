import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalParseIntPipe implements PipeTransform {
  transform(value: unknown): number | undefined {
    const val = parseInt(String(value), 10);
    if (isNaN(val)) {
      throw new BadRequestException(`${value} is not a valid number`);
    }
    return val;
  }
}
