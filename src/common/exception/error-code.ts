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
