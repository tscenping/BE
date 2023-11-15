export type FtOauthResponseDto = {
	grant_type: string;
	client_id: string;
	client_secret: string;
	code: string;
	redirect_uri: string;
};
