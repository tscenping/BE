import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { customHttpException } from './custom-exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: customHttpException | any, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const request = context.getRequest<Request>();
		const response = context.getResponse<Response>();

		let errorCode;
		let message;
		if (exception instanceof customHttpException) {
			errorCode = exception.getErrorCode();
			message = exception.message;
		} else {
			errorCode = exception.getState() ? exception.getState() : 500;
			message = exception.message
				? exception.message
				: 'Internal Server Error';
		}

		response.json({
			statusCode: errorCode,
			message: message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}
