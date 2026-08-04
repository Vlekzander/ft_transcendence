import { AppDomainError } from "./domain.errors";

export class ValidationError extends AppDomainError {
	constructor(input: string, message: string) {
		super(message);
		this.name = `${input[0].toUpperCase() + input.slice(1)}ValidationError`;
	}
}
