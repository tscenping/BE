export class UserSigninResponseDto {
  userId: number;
  isFirstLogin: boolean;
  isMfaEnabled: boolean;
  mfaQRCode: string;
}
