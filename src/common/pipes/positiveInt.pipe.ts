import { HttpException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PositiveIntPipe implements PipeTransform {
	transform(value: number) {
		if (value < 0) {
			throw new HttpException('value > 0', HttpStatus.BAD_REQUEST);
		}
		return value;
	}
}
