import { FriendUserReturnDto } from './friend-user-return.dto';

export type BlockUserResponseDto = {
	friends: FriendUserReturnDto[];

	totalItemCount: number;
};
