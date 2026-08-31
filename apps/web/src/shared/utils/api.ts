export const DEFAULT_ERROR = "An error has occurred";

export async function getApiErrorMessage(res: Response): Promise<string> {
	try {
		const data = await res.json();
		return data?.error?.message ?? DEFAULT_ERROR;
	} catch {
		return DEFAULT_ERROR;
	}
}
