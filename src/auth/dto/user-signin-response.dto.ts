export type UserSigninResponseDto = {
	userId: string;
	isFirstLogin: boolean;
	isMfaEnabled: boolean;
	mfaCode?: string;
};
