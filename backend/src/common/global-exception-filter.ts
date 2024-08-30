import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UnprocessableEntityError } from './error/unprocessable-entity-error';
import { ApiResponse } from './api-response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    //const request = ctx.getRequest<Request>();

    let status: number;
    const errors = [];

    if (exception instanceof UnprocessableEntityError) {
      status = 400;
      errors.push(`${exception.name}: ${exception.message}`);
    } else {
      status = 500;
      errors.push('Internal server error');
      console.log(exception);
    }

    const apiResponse: ApiResponse = {
      status: 'fail',
      errors,
    };

    response.status(status).json(apiResponse);
  }
}
