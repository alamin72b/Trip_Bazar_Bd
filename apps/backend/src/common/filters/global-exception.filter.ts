import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof MulterError) {
      const multerException = exception as MulterError;
      const message =
        multerException.code === 'LIMIT_FILE_SIZE'
          ? 'Each uploaded image must be 5 MB or smaller.'
          : multerException.code === 'LIMIT_FILE_COUNT'
            ? 'You can upload up to 6 images at a time.'
            : 'Upload request could not be processed.';

      const wrappedException = new BadRequestException(message);
      const errorResponse = wrappedException.getResponse();

      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          typeof errorResponse === 'string'
            ? errorResponse
            : ((errorResponse as { message?: string | string[] }).message ??
              'Upload request could not be processed.'),
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';
    const message =
      typeof errorResponse === 'string'
        ? errorResponse
        : ((errorResponse as { message?: string | string[] }).message ??
          'Internal server error');

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
