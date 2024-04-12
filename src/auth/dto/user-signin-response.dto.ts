export type UserSigninResponseDto = {
	userId: number;
	nickname: string;
	isFirstLogin: boolean;
	isMfaEnabled: boolean;
	mfaUrl?: string;
};
