// ball 변하는 값
import { KEYNAME, KEYSTATUS } from '../../common/enum';

export type ball = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	xVelocity: number; // 속력: 속도 * 방향
	yVelocity: number;
	accel: number; // 새로운 판마다 증가
};

// racket 변하는 값
export type racket = {
	y: number;
	action: KEYSTATUS | null; // up, down
};

export class UpdateDto {
	racketLeft: {
		x: number;
		y: number;
	};
	racketRight: {
		x: number;
		y: number;
	};
	ball: {
		x: number;
		y: number;
	};
	scoreLeft: boolean;
	scoreRight: boolean;

	constructor() {
		this.racketLeft = { x: 0, y: 0 };
		this.racketRight = { x: 0, y: 0 };
		this.ball = { x: 0, y: 0 };
		this.scoreLeft = false;
		this.scoreRight = false;
	}

	isScoreChanged(): boolean {
		return this.scoreLeft || this.scoreRight;
	}
}

export class ViewMapDto {
	ball: ball;
	ballSpeed: number;
	racketLeft: racket;
	racketRight: racket;
	racketSize: number;
	private readonly updateDto: UpdateDto;

	constructor(
		ballSpeed: number,
		racketSize: number,

		// 고정값
		readonly canvasWidth = 1200,
		readonly canvasHeight = 800,

		readonly ballRadius = 10,

		readonly racketWidth = canvasWidth * 0.01,
		readonly racketHeight = canvasHeight * 0.25,
		readonly racketLeftX = 10,
		readonly racketRightX = canvasWidth - racketWidth - 10,
		readonly racketSpeed = 20,

		readonly deltaTime = 1 / 60,
	) {
		this.updateDto = new UpdateDto();
		if (ballSpeed == 1) this.ballSpeed = 300;
		else if (ballSpeed == 2) this.ballSpeed = 400;
		else this.ballSpeed = 500;

		this.ball = {
			x: canvasWidth / 2,
			y: canvasHeight / 2,
			vx: 0,
			vy: 0,
			xVelocity:
				this.ballSpeed * ((Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1),
			yVelocity:
				this.ballSpeed * ((Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1),
			accel: 200,
		};

		this.racketLeft = {
			y: canvasHeight / 2 - racketHeight / 2,
			action: null,
		};
		this.racketRight = {
			y: canvasHeight / 2 - racketHeight / 2,
			action: null,
		};
		this.racketSize = racketSize;
	}

	async initObjects() {
		this.updateDto.scoreLeft = false;
		this.updateDto.scoreRight = false;

		this.ball.x = this.canvasWidth / 2;
		this.ball.y = this.canvasHeight / 2;
		this.ball.vx = 0;
		this.ball.vy = 0;
		// this.ball.xVelocity =
		// 	this.ballSpeed * ((Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1);
		// this.ball.yVelocity =
		// 	this.ballSpeed * ((Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1);
		this.ball.accel += 50;
		this.ball.xVelocity +=
			this.ball.accel *
			this.deltaTime *
			(this.ball.xVelocity > 0 ? 1 : -1);
		this.ball.yVelocity +=
			this.ball.accel *
			this.deltaTime *
			(this.ball.yVelocity > 0 ? 1 : -1);

		this.racketLeft.y = this.canvasHeight / 2 - this.racketHeight / 2;
		this.racketRight.y = this.canvasHeight / 2 - this.racketHeight / 2;
	}

	private async calculateNextBallLocation() {
		const ball = this.ball;
		const dt = this.deltaTime;

		// 공의 위치 변화량 계산
		ball.vx =
			ball.xVelocity * dt +
			(ball.xVelocity < 0 ? ball.accel * -1 : ball.accel) * dt * dt * 0.5;
		ball.vy =
			ball.yVelocity * dt +
			(ball.yVelocity < 0 ? ball.accel * -1 : ball.accel) * dt * dt * 0.5;
	}

	updateRacketLeft(action: KEYNAME) {
		const racket = this.racketLeft;

		if (action === KEYNAME.arrowUp) {
			racket.y -= this.racketSpeed;
		} else if (action === KEYNAME.arrowDown) {
			racket.y += this.racketSpeed;
		}

		if (racket.y <= 0) racket.y = 0;
		if (racket.y + this.racketHeight >= this.canvasHeight)
			racket.y = this.canvasHeight - this.racketHeight;
	}

	updateRacketRight(action: KEYNAME) {
		const racket = this.racketRight;

		if (action === KEYNAME.arrowUp) {
			racket.y -= this.racketSpeed;
		} else if (action === KEYNAME.arrowDown) {
			racket.y += this.racketSpeed;
		}

		if (racket.y <= 0) racket.y = 0;
		if (racket.y + this.racketHeight >= this.canvasHeight)
			racket.y = this.canvasHeight - this.racketHeight;
	}

	async changes() {
		const updateDto = this.updateDto;
		const ball = this.ball;
		await this.calculateNextBallLocation();

		const xChange = this.ballRadius;
		const piece = Math.abs(ball.vx / xChange);
		const xRemain = Math.abs(ball.vx % xChange);
		const yChange = Math.abs(xChange * (ball.vy / ball.vx));
		const yRemain = Math.abs(ball.vy % yChange);

		for (let i = 0; i < Math.floor(piece); i++) {
			ball.x += xChange * (ball.xVelocity > 0 ? 1 : -1);
			ball.y += yChange * (ball.yVelocity > 0 ? 1 : -1);
			console.log(`\nbefore piece ball.x: ${ball.x}`);
			console.log(`before piece xVelocity: ${ball.xVelocity}`);
			await this.detectCollision();
			console.log(`after piece ball.x: ${ball.x}`);
			console.log(`after piece xVelocity: ${ball.xVelocity}`);
		}
		ball.x += xRemain * (ball.xVelocity > 0 ? 1 : -1);
		ball.y += yRemain * (ball.yVelocity > 0 ? 1 : -1);
		console.log(`before remain ball.x: ${ball.x}`);
		console.log(`before remain xVelocity: ${ball.xVelocity}`);
		await this.detectCollision();
		console.log(`after remain ball.x: ${ball.x}`);
		console.log(`after remain xVelocity: ${ball.xVelocity}`);

		//score
		if (ball.x + this.ballRadius >= this.canvasWidth)
			updateDto.scoreLeft = true; // right
		else if (ball.x - this.ballRadius <= 0) updateDto.scoreRight = true; // left

		// 내보내기
		updateDto.racketLeft = {
			x: this.racketLeftX,
			y: this.racketLeft.y,
		};
		updateDto.racketRight = {
			x: this.racketRightX,
			y: this.racketRight.y,
		};
		updateDto.ball = {
			x: this.ball.x,
			y: this.ball.y,
		};

		return updateDto;
	}

	private async detectCollision() {
		const ball = this.ball;
		let dx, dy;

		// 새로운 방향이 양수면 오른쪽 racket, 음수면 왼쪽 racket이랑 부딪히는지 검사
		if (this.ball.vx > 0) {
			dx = Math.abs(ball.x - this.getRacketRightCenter().cx);
			dy = Math.abs(ball.y - this.getRacketRightCenter().cy);
			if (
				dx <= this.ballRadius + this.racketWidth / 2 &&
				dy <= this.ballRadius + this.racketHeight / 2 &&
				ball.xVelocity > 0
			) {
				ball.xVelocity *= -1;
				// console.log('\nbefore speed: ', Math.abs(ball.xVelocity));
				ball.xVelocity +=
					ball.accel *
					2 *
					this.deltaTime *
					(ball.xVelocity > 0 ? 1 : -1);

				// console.log(
				// 	'collision right -> ',
				// 	ball.accel *
				// 		2 *
				// 		this.deltaTime *
				// 		(ball.xVelocity > 0 ? 1 : -1),
				// );
				console.log('accel, deltaTime: ', ball.accel, this.deltaTime);
				console.log('after speed: ', Math.abs(ball.xVelocity));
			}
		} else if (this.ball.vx < 0) {
			dx = Math.abs(ball.x - this.getRacketLeftCenter().cx);
			dy = Math.abs(ball.y - this.getRacketLeftCenter().cy);
			if (
				dx <= this.ballRadius + this.racketWidth / 2 &&
				dy <= this.ballRadius + this.racketHeight / 2 &&
				ball.xVelocity < 0
			) {
				ball.xVelocity *= -1;
				// console.log('\nbefore speed: ', Math.abs(ball.xVelocity));
				ball.xVelocity +=
					ball.accel *
					2 *
					this.deltaTime *
					(ball.xVelocity > 0 ? 1 : -1);
				// console.log(
				// 	'collision left -> ',
				// 	ball.accel *
				// 		2 *
				// 		this.deltaTime *
				// 		(ball.xVelocity > 0 ? 1 : -1),
				// );
				console.log('accel, deltaTime: ', ball.accel, this.deltaTime);
				console.log('after speed: ', Math.abs(ball.xVelocity));
			}
		}

		// 바닥, 천장
		if (
			(ball.y + this.ballRadius >= this.canvasHeight &&
				ball.yVelocity > 0) ||
			(ball.y - this.ballRadius < 0 && ball.yVelocity < 0)
		)
			ball.yVelocity *= -1;
	}

	private getRacketLeftCenter() {
		return {
			cx: this.racketLeftX + this.racketWidth / 2,
			cy: this.racketLeft.y + this.racketHeight / 2,
		};
	}

	private getRacketRightCenter() {
		return {
			cx: this.racketRightX + this.racketWidth / 2,
			cy: this.racketRight.y + this.racketHeight / 2,
		};
	}
}
