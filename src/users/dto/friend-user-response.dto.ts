import { FriendUserReturnDto } from './friend-user-return.dto';

export type FriendUserResponseDto = {
	friends: FriendUserReturnDto[];

	totalItemCount: number;
};
