import { ValidationError } from "../errors/validation.errors";
import { LoginUserSchema, RegisterUserSchema } from "../schemas/user.schemas";

export function parseRegisterUser(intput: unknown) {
	const result = RegisterUserSchema.safeParse(intput);

	if (result.success) return result.data;

	const issue = result.error.issues[0];

	if (issue?.path[0] === "username")
		throw new ValidationError("username", issue.message);
	if (issue?.path[0] === "email")
		throw new ValidationError("email", issue.message);
	if (issue?.path[0] === "password")
		throw new ValidationError("password", issue.message);
	if (issue?.path[0] === "confirmPassword")
		throw new ValidationError("confirmPassword", issue.message);
	throw new ValidationError("Input", "Invalid registration data");
}

export function parseLoginUser(input: unknown) {
	const result = LoginUserSchema.safeParse(input);

	if (result.success) return result.data;

	const issue = result.error.issues[0];

	if (issue?.path[0] === "username")
		throw new ValidationError("username", issue.message);
	if (issue?.path[0] === "password")
		throw new ValidationError("password", issue.message);
	throw new ValidationError("Input", "Invalid registration data");
}
