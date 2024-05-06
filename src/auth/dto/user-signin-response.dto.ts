export type UserSigninResponseDto = {
	userId: number;
	nickname: string | null;
	isFirstLogin: boolean;
	isMfaEnabled: boolean;
	mfaUrl?: string;
};
