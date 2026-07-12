const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: unknown): email is string {
	return typeof email === "string" && EMAIL_REGEX.test(email);
}

export function isValidUsername(username: unknown): username is string {
	return typeof username === "string" && username.trim().length > 0;
}

export function isValidPassword(password: unknown): password is string {
	return (
		typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH
	);
}
