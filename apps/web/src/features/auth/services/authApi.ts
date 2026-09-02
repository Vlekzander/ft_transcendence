import {
	parseLoginUserNoThrow,
	parseRegisterUserNoThrow,
	type LoginUserDTO,
	type RegisterUserDTO,
} from "@ft_transcendence/shared";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";
import {
	mapValidationErrors,
	type ValidationErrors,
} from "../../../shared/types/ValidationTypes";

export type AuthResult =
	| { ok: true }
	| { ok: false; error: string; errors?: ValidationErrors };

async function authUser(
	input: RegisterUserDTO | LoginUserDTO,
	path: string,
): Promise<AuthResult> {
	try {
		const res = await fetch(`${API_URL}/auth/${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});

		if (res.ok) return { ok: true };

		const error = await getApiErrorMessage(res);
		return { ok: false, error };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : DEFAULT_ERROR,
		};
	}
}

export async function registerUser(
	input: RegisterUserDTO,
): Promise<AuthResult> {
	const parsed = parseRegisterUserNoThrow(input);

	if (Array.isArray(parsed))
		return { ok: false, error: "", errors: mapValidationErrors(parsed) };
	return authUser(parsed, "register");
}

export async function loginUser(input: LoginUserDTO): Promise<AuthResult> {
	const parsed = parseLoginUserNoThrow(input);

	if (Array.isArray(parsed))
		return { ok: false, error: "", errors: mapValidationErrors(parsed) };
	return authUser(parsed, "login");
}
