export type UserProfileResponseDto = {
	id: number;
	nickname: string;
	avatar: string;
	statusMessage: string | null;
	loseCount: number;
	winCount: number;
	totalCount: number;
	ladderScore: number;
	ladderMaxScore: number;
	ladderRank: number;
	isFriend: boolean;
	isBlocked: boolean;
};

export type UserProfileReturnDto = {
	id: number;
	nickname: string;
	avatar: string;
	statusMessage: string | null;
	loseCount: number;
	winCount: number;
	totalCount: number;
	ladderScore: number;
	ladderMaxScore: number;
	ladderRank: number;
};
