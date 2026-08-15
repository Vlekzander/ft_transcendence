export type AvatarDTO = {
	uuid: string;
	path: string;
};

export type PublicUserDTO = {
	uuid: string;
	username: string;
	avatar: AvatarDTO | null;
};
