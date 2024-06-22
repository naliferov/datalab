import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { DataType } from '../entities/data.type';
//import { ApiProperty } from 'nestjs/swagger';

export class MapSetKeyDto {
  @IsString()
  key: string;

  @IsNumber()
  @IsOptional()
  orderIndex: number | undefined;

  @IsObject()
  data: DataType;
}
