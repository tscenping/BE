import { RankUserReturnDto } from "./rank-user-return.dto";

export type RankUserResponseDto = {
    rankUsers: RankUserReturnDto[];

    totalItemCount: number;
};