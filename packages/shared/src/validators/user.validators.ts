import { ValidationError } from "../errors/validation.errors";
import {
	LoginUserDTO,
	LoginUserSchema,
	RegisterUserDTO,
	RegisterUserSchema,
} from "../schemas/user.schemas";

export function parseRegisterUser(input: unknown): RegisterUserDTO {
	const result = RegisterUserSchema.safeParse(input);

	if (result.success) return result.data;

	const issue = result.error.issues[0];
	const field = issue?.path[0];

	if (
		field === "username" ||
		field === "email" ||
		field === "password" ||
		field === "confirmPassword"
	)
		throw new ValidationError(field, issue.message);
	throw new ValidationError("Input", "Invalid registration data");
}

export function parseRegisterUserNoThrow(
	intput: unknown,
): RegisterUserDTO | ValidationError[] {
	const result = RegisterUserSchema.safeParse(intput);

	if (result.success) return result.data;

	const errors = result.error.issues.map(
		(issue) =>
			new ValidationError(String(issue.path[0] ?? ""), issue.message),
	);
	return errors;
}

export function parseLoginUserNoThrow(
	intput: unknown,
): LoginUserDTO | ValidationError[] {
	const result = RegisterUserSchema.safeParse(intput);

	if (result.success) return result.data;

	const errors = result.error.issues.map(
		(issue) =>
			new ValidationError(String(issue.path[0] ?? ""), issue.message),
	);
	return errors;
}

export function parseLoginUser(input: unknown): LoginUserDTO {
	const result = LoginUserSchema.safeParse(input);

	if (result.success) return result.data;

	const issue = result.error.issues[0];
	const field = issue?.path[0];

	if (field === "username" || field === "password")
		throw new ValidationError(field, issue.message);
	throw new ValidationError("Input", "Invalid registration data");
}
