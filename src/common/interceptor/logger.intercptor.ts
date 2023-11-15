import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const currentClass = context.getClass().name;
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();

		const now = Date.now();
		const date = new Date().toISOString().split('T')[0];
		const time = new Date().toISOString().split('T')[1];

		return next.handle().pipe(
			catchError((error: any) => {
				// console.error(
				//   `🚨ERR! [${currentClass}][${date}  ${time}]+[${
				//     Date.now() - now
				//   }ms]${'\n'}        ${error}`,
				// );
				throw error;
			}),
			tap(() => {
				console.log(
					`[${currentClass}][${date}, ${time}] +[${
						Date.now() - now
					}ms]${'\n'}        request: ${JSON.stringify(request.body)}${'\n'}        reponse: ${JSON.stringify(
						response.body,
					)}, ${JSON.stringify(response.statusText)}`,
				);
			}),
		);
	}
}
