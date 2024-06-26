export type UserProfileResponseDto = {
	id: number;
	nickname: string;
	avatar: string | null;
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
