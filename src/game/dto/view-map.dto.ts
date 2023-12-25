// ball 변하는 값
import { KEYNAME } from '../../common/enum';

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
	action: string | null; // up, down
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

		readonly ballRadius = 2,

		readonly racketWidth = canvasWidth * 0.05,
		readonly racketHeight = canvasHeight * 0.1,
		readonly racketLeftX = 10,
		readonly racketRightX = canvasWidth - racketWidth - 10,
		readonly racketSpeed = 6,

		readonly deltaTime = 1 / 10,
	) {
		this.updateDto = new UpdateDto();
		this.ball = {
			x: canvasWidth / 2,
			y: canvasHeight / 2,
			vx: 0,
			vy: 0,
			xVelocity: ballSpeed * (Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1,
			yVelocity: ballSpeed * (Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1,
			accel: 0,
		};
		this.ballSpeed = ballSpeed;

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
		this.ball.vx = 0;
		this.ball.vy = 0;
		this.updateDto.scoreLeft = false;
		this.updateDto.scoreRight = false;

		this.ball.x = this.canvasWidth / 2;
		this.ball.y = this.canvasHeight / 2;
		this.ball.xVelocity =
			this.ballSpeed * (Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1;
		this.ball.yVelocity =
			this.ballSpeed * (Math.random() < 0.5 ? 0 : 1) === 0 ? 1 : -1;

		this.ball.accel += 0.2;
		this.racketLeft.y = this.canvasHeight / 2 - this.racketHeight / 2;
		this.racketRight.y = this.canvasHeight / 2 - this.racketHeight / 2;
	}

	private async updateBall() {
		const ball = this.ball;
		const dt = this.deltaTime;

		// 공의 위치 업데이트
		const x = ball.x + ball.xVelocity * dt + ball.accel * dt * dt * 0.5;
		const y = ball.y + ball.yVelocity * dt + ball.accel * dt * dt * 0.5;
		// 공의 속력 업데이트
		ball.xVelocity += ball.accel * dt * (ball.xVelocity > 0 ? 1 : -1);
		ball.yVelocity += ball.accel * dt * (ball.yVelocity > 0 ? 1 : -1);

		this.ball.vx = x - ball.x;
		this.ball.vy = y - ball.y;
		this.ball.x = x;
		this.ball.y = y;
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
		await this.updateBall();

		// racket, 천장, 바닥에 부딪히는지
		await this.detectCollision();

		//score
		if (ball.x + this.ballRadius >= this.canvasWidth)
			updateDto.scoreRight = true; // right
		else if (ball.x - this.ballRadius <= 0) updateDto.scoreLeft = true; // left

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
				dy <= this.ballRadius + this.racketHeight / 2
			)
				ball.xVelocity *= -1;
		} else if (this.ball.vx < 0) {
			dx = Math.abs(ball.x - this.getRacketLeftCenter().cx);
			dy = Math.abs(ball.y - this.getRacketLeftCenter().cy);
			if (
				dx <= this.ballRadius + this.racketWidth / 2 &&
				dy <= this.ballRadius + this.racketHeight / 2
			)
				ball.xVelocity *= -1;
		}

		// 바닥, 천장
		if (
			ball.y + this.ballRadius >= this.canvasHeight ||
			ball.y - this.ballRadius <= 0
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
