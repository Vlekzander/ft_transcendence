import type { ValidationError } from "@ft_transcendence/shared";

const errorFieldMap = {
	UsernameValidationError: "username",
	EmailValidationError: "email",
	PasswordValidationError: "password",
	ConfirmPasswordValidationError: "confirmPassword",
} as const;

type ErrorField = (typeof errorFieldMap)[keyof typeof errorFieldMap];

export type ValidationErrors = Partial<Record<ErrorField, string>>;

export function mapValidationErrors(
	errors: ValidationError[],
): ValidationErrors {
	const nextErrors: ValidationErrors = {};
	for (const err of errors) {
		const field = errorFieldMap[err.name as keyof typeof errorFieldMap];
		if (field) nextErrors[field] = err.message;
	}
	return nextErrors;
}
