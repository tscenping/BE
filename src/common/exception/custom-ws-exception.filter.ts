import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { EVENT_ERROR } from '../events';

@Catch(WsException)
export class WsFilter extends BaseWsExceptionFilter {
	catch(exception: WsException, host: ArgumentsHost) {
		const client = host.switchToWs().getClient();

		client.emit(EVENT_ERROR, { message: exception.message });
		client.disconnect();
	}
}
