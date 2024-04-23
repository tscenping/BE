import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger 세팅
 *
 * @param {INestApplication} app
 */

export function setupSwagger(app: INestApplication): void {
	const options = new DocumentBuilder()
		.setTitle('˗ˋˏ♡ˎˊ˗트 센 핑˗ˋˏ♡ˎˊ˗')
		.setDescription(
			'문서화 하기 귀찮은 P들을 위한 API 문서\n' +
				'figma: https://www.figma.com/file/VdfgO5Us78FYGws6sEjRgA/tscenping?type=design&node-id=17-106&mode=design&t=9nlxXQ5yhqzFl3jm-0',
		)
		.setVersion('1.0.0')
		.addTag('TSC')
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('swagger', app, document);
	console.log('Swagger is running on https://localhost:3000/swagger');
}
