import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HealthController {
	@Get('/')
	@ApiOperation({
		summary: '헬스 체크',
		description: '서버의 상태를 체크합니다.',
	})
	healthCheck() {
		return 'ok';
	}
}
