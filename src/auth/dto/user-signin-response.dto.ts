export type UserSigninResponseDto = {
  userId: number;
  isFirstLogin: boolean;
  isMfaEnabled: boolean;
  mfaCode?: string;
};
