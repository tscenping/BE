import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { customException } from './custom-exception';

@Catch(customException)
export class ToHttpFilter implements ExceptionFilter {
	// private readonly logger: Logger = new Logger();

	catch(exception: customException, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const statusCode = exception.getStatus();
		const message = exception.message;
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		// const logStack = exception.stack;
		// this.logger.error(logStack);

		response.json({
			statusCode: statusCode,
			message: message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}
