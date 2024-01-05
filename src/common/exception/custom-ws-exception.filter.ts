import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { customWsException } from './custom-exception';

@Catch(customWsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
	catch(exception: customWsException, host: ArgumentsHost) {
		const client = host.switchToWs().getClient();
		const errorCode = exception.getErrorCode();
		const message = exception.message;
		client.emit('error', {
			statusCode: errorCode,
			message: message,
		});
		client.disconnect();
	}
}
