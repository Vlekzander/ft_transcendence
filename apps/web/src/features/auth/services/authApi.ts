import {
	type LoginUserDTO,
	type RegisterUserDTO,
} from "@ft_transcendence/shared";
import { API_URL } from "../../../config";
import { DEFAULT_ERROR, getApiErrorMessage } from "../../../shared/utils/api";

export type AuthResult<
	T extends Record<string, unknown> = Record<string, unknown>,
> =
	| { ok: true }
	| { ok: false; error: string; errors?: Partial<Record<keyof T, string>> };

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
	return authUser(input, "register");
}

export async function loginUser(input: LoginUserDTO): Promise<AuthResult> {
	return authUser(input, "login");
}
