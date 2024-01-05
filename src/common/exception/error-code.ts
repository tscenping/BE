import { HttpStatus } from '@nestjs/common';

class ErrorCodeValueObject {
	readonly errorCode: number;
	readonly message: string;

	constructor(errorCode: number, message: string) {
		this.errorCode = errorCode;
		this.message = message;
	}
}

export type ErrorCode = ErrorCodeValueObject;

export const UNAUTHORIZED_ERROR = new ErrorCodeValueObject(
	HttpStatus.UNAUTHORIZED,
	'Unauthorized user detected',
);

export const BAD_REQUEST_ERROR = new ErrorCodeValueObject(
	HttpStatus.BAD_REQUEST,
	'Bad request',
);

export const CONFLICT_ERROR = new ErrorCodeValueObject(
	HttpStatus.CONFLICT,
	'Conflict',
);

export const FORBIDDEN_ERROR = new ErrorCodeValueObject(
	HttpStatus.FORBIDDEN,
	'Forbidden',
);

export const NOT_FOUND_ERROR = new ErrorCodeValueObject(
	HttpStatus.NOT_FOUND,
	'Not found',
);

export const DB_UPDATE_FAILURE = new ErrorCodeValueObject(
	HttpStatus.INTERNAL_SERVER_ERROR,
	'DataBase task could not be done',
);

export const DB_QUERY_ERROR = new ErrorCodeValueObject(
	HttpStatus.INTERNAL_SERVER_ERROR,
	'Sending query could not be done',
);

// socket
export const WS_UNAUTHORIZED_ERROR = new ErrorCodeValueObject(
	HttpStatus.UNAUTHORIZED,
	'WebSocket: unauthorized user detected',
);

export const WS_BAD_REQUEST_ERROR = new ErrorCodeValueObject(
	HttpStatus.BAD_REQUEST,
	'WebSocket: bad request',
);

export const WS_DB_UPDATE_FAILURE = new ErrorCodeValueObject(
	HttpStatus.INTERNAL_SERVER_ERROR,
	'WebSocket: dataBase task could not be done',
);
