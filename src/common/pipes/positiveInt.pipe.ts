import { Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestException } from '../exception/custom-exception';

@Injectable()
export class PositiveIntPipe implements PipeTransform {
	transform(value: number) {
		if (value < 0) {
			throw BadRequestException('value > 0');
		}
		return value;
	}
}
