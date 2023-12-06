import {
	DB_QUERY_ERROR,
	DB_UPDATE_FAILURE,
	ErrorCode,
	WS_BAD_REQUEST_ERROR,
	WS_UNAUTHORIZED_ERROR,
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

export const DBUpdateFailureException = (message?: string): customException => {
	return new customException(DB_UPDATE_FAILURE, message);
};

export const DBQueryErrorException = (message?: string): customException => {
	return new customException(DB_QUERY_ERROR, message);
};

export const WSUnauthorizedException = (message?: string): customException => {
	return new customException(WS_UNAUTHORIZED_ERROR, message);
};

export const WSBadRequestException = (message?: string): customException => {
	return new customException(WS_BAD_REQUEST_ERROR, message);
};
