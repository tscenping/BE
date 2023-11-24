export type MyProfileResponseDto = {
	id: number;
	nickname: string;
	avatar: string;
	statusMessage: string;
	loseCount: number;
	winCount: number;
	totalCount: number;
	ladderScore: number;
	ladderMaxScore: number;
	ladderRank: number; // TODO: ladderRank cache에서 조회하기
};
