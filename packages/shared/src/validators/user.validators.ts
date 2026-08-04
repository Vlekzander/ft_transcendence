import { ValidationError } from "../errors/validation.errors";
import { LoginUserSchema, RegisterUserSchema } from "../schemas/user.schemas";

export function parseRegisterUser(intput: unknown, toThrow = true) {
	const result = RegisterUserSchema.safeParse(intput);

	if (result.success) return result.data;

	const errors = result.error.issues.map(
		(issue) =>
			new ValidationError(String(issue.path[0] ?? ""), issue.message),
	);
	if (toThrow) throw errors[0];
	return errors;
}

export function parseLoginUser(input: unknown, toThrow = true) {
	const result = LoginUserSchema.safeParse(input);

	if (result.success) return result.data;

	const errors = result.error.issues.map(
		(issue) =>
			new ValidationError(String(issue.path[0] ?? ""), issue.message),
	);
	if (toThrow) throw errors[0];
	return errors;
}
