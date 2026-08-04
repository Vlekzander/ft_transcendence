export class AppDomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AppDomainError";
	}
}
