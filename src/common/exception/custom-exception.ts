import {
	ErrorCode,
	UNAUTHORIZED_ERROR,
	BAD_REQUEST_ERROR,
	DB_QUERY_ERROR,
	DB_UPDATE_FAILURE,
	WS_BAD_REQUEST_ERROR,
	WS_DB_UPDATE_FAILURE,
	WS_UNAUTHORIZED_ERROR, CONFLICT_ERROR, FORBIDDEN_ERROR,
} from './error-code';
import { WsException } from '@nestjs/websockets';
export class customHttpException extends Error {
	readonly errorCode: ErrorCode;

	constructor(errorCode: ErrorCode, message?: string | undefined) {
		if (!message) {
			message = errorCode.message;
		} // message를 설정하고
		super(message); // 부모 Error의 생성자에 message를 넘겨줌
		this.errorCode = errorCode;
	}

	getErrorCode() {
		return this.errorCode.errorCode;
	}
}

export class customWsException extends WsException {
	readonly errorCode: ErrorCode;

	constructor(errorCode: ErrorCode, message?: string | undefined) {
		if (!message) {
			message = errorCode.message;
		} // message를 설정하고
		super(message); // 부모 Error의 생성자에 message를 넘겨줌
		this.errorCode = errorCode;
	}

	getErrorCode() {
		return this.errorCode.errorCode;
	}
}

export const UnauthorizedException = (
	message?: string,
): customHttpException => {
	return new customHttpException(UNAUTHORIZED_ERROR, message);
};

export const BadRequestException = (message?: string): customHttpException => {
	return new customHttpException(BAD_REQUEST_ERROR, message);
};

export const ConflictException = (message?: string): customHttpException => {
	return new customHttpException(CONFLICT_ERROR, message);
};

export const ForbiddenException = (message?: string): customHttpException => {
	return new customHttpException(FORBIDDEN_ERROR, message);
};

export const DBUpdateFailureException = (
	message?: string,
): customHttpException => {
	return new customHttpException(DB_UPDATE_FAILURE, message);
};

export const DBQueryErrorException = (
	message?: string,
): customHttpException => {
	return new customHttpException(DB_QUERY_ERROR, message);
};

export const WSUnauthorizedException = (
	message?: string,
): customWsException => {
	return new customWsException(WS_UNAUTHORIZED_ERROR, message);
};

export const WSBadRequestException = (message?: string): customWsException => {
	return new customWsException(WS_BAD_REQUEST_ERROR, message);
};

export const WSDBUpdateFailureException = (
	message?: string,
): customWsException => {
	return new customWsException(WS_DB_UPDATE_FAILURE, message);
};
