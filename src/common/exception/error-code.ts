import { HttpStatus } from '@nestjs/common';

class ErrorCodeValueObject {
	readonly statusCode: number;
	readonly message: string;

	constructor(statusCode: number, message: string) {
		this.statusCode = statusCode;
		this.message = message;
	}
}

export type ErrorCode = ErrorCodeValueObject;

export const DB_UPDATE_FAILURE = new ErrorCodeValueObject(
	HttpStatus.INTERNAL_SERVER_ERROR,
	'DataBase task could not be done',
);

export const DB_QUERY_ERROR = new ErrorCodeValueObject(
	HttpStatus.INTERNAL_SERVER_ERROR,
	'Query task could not be done',
);

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
	'WebSocket: DataBase task could not be done',
);
