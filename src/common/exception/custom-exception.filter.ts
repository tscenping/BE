import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { customException } from './custom-exception';

@Catch(customException)
export class HttpFilter implements ExceptionFilter {
	// private readonly logger: Logger = new Logger();

	catch(exception: customException, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const statusCode = exception.getStatus();
		const message = exception.message;
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();

		response.json({
			statusCode: statusCode,
			message: message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}
