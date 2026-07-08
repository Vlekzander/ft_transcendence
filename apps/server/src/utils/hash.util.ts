import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function generateHash(data: string): Promise<string> {
	return bcrypt.hash(data, SALT_ROUNDS);
}

export async function compareHash(
	data: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(data, hash);
}
