export class EmitEventServerGameReadyParamDto {
	rivalNickname: string;
	rivalAvatar: string;
	myPosition: string;
	ball: {
		x: number;
		y: number;
		radius: number;
	};
	myRacket: {
		x: number;
		y: number;
		height: number;
		width: number;
	};
	rivalRacket: {
		x: number;
		y: number;
		height: number;
		width: number;
	};
}
