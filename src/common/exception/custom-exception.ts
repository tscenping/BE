import { WsException } from '@nestjs/websockets';
import {
	DB_QUERY_ERROR,
	DB_UPDATE_FAILURE,
	ErrorCode,
	WS_BAD_REQUEST_ERROR,
	WS_DB_UPDATE_FAILURE,
	WS_UNAUTHORIZED_ERROR,
	WsErrorCode,
} from './error-code';
export class customException extends Error {
	readonly errorCode: ErrorCode;

	constructor(errorCode: ErrorCode, message?: string | undefined) {
		if (!message) {
			message = errorCode.message;
		} // message를 설정하고
		super(message); // 부모 Error의 생성자에 message를 넘겨줌
		this.errorCode = errorCode;
	}

	getStatus() {
		return this.errorCode.statusCode;
	}
}

export class customWsException extends WsException {
	readonly errorCode: WsErrorCode;

	constructor(errorCode: WsErrorCode, message?: string | undefined) {
		if (!message) {
			message = errorCode.message;
		} // message를 설정하고
		super(message); // 부모 Error의 생성자에 message를 넘겨줌
	}
}

export const DBUpdateFailureException = (message?: string): customException => {
	return new customException(DB_UPDATE_FAILURE, message);
};

export const DBQueryErrorException = (message?: string): customException => {
	return new customException(DB_QUERY_ERROR, message);
};

export const WSUnauthorizedException = (
	message?: string,
): customWsException => {
	return new customWsException(WS_UNAUTHORIZED_ERROR, message);
};

export const WSBadRequestException = (message?: string): customWsException => {
	return new customWsException(WS_BAD_REQUEST_ERROR, message);
};

export const WSDuplicateLoginException = (
	message?: string,
): customWsException => {
	return new customWsException(WS_BAD_REQUEST_ERROR, message);
};

export const WSDBUpdateFailureException = (
	message?: string,
): customWsException => {
	return new customWsException(WS_DB_UPDATE_FAILURE, message);
};
