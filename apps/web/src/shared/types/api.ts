export type ApiResult<
	T extends Record<string, unknown> = Record<string, unknown>,
> =
	| { ok: true }
	| { ok: false; error: string; errors?: Partial<Record<keyof T, string>> };
