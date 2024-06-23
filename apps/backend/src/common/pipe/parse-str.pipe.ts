import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ParseStrPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException(
        `Validation failed: "${metadata.data}" must be a non-empty string.`,
      );
    }
    return value;
  }
}
