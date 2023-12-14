// ball 변하는 값
type ball = {
	x: number;
	y: number;
	speed: number;
};

// racket 변하는 값
type racket = {
	y: number;
	size: number;
};

export class ViewMapDto {
	ball: ball;
	racket1: racket;
	racket2: racket;

	constructor(
		ballSpeed: number,
		racketSize: number,

		// 고정값
		private readonly canvasWidth = 1400,
		private readonly canvasHeight = 1000,

		private readonly ballRadius = 2,

		private readonly racketWidth = canvasWidth * 0.1,
		private readonly racketHeight = canvasHeight * 0.4,
		private readonly racket1X = 0,
		private readonly racket2X = canvasWidth - racketWidth,
	) {
		this.ball.x = canvasWidth / 2;
		this.ball.y = canvasHeight / 2;
		this.ball.speed = ballSpeed;

		this.racket1.y = canvasHeight / 2 - racketHeight / 2;
		this.racket2.y = canvasHeight / 2 - racketHeight / 2;
		this.racket1.size = racketSize;
		this.racket2.size = racketSize;
	}
}
