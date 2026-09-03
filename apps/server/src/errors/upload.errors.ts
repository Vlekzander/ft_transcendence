import { AppDomainError } from "@ft_transcendence/shared";

export class InvalidFileError extends AppDomainError {
	constructor(message: string) {
		super(message);
		this.name = "InvalidFileError";
	}
}

export class NoFileUploadError extends InvalidFileError {
	constructor() {
		super("No file uploaded");
		this.name = "NoFileUploadError";
	}
}

export class InvalidFileTypeError extends InvalidFileError {
	constructor() {
		super("Invalid file type uploaded");
		this.name = "InvalidFileTypeError";
	}
}

export class InvalidFileSizeError extends InvalidFileError {
	constructor(size: number) {
		super(`Invalid file size uploaded (max: ${size} MB)`);
		this.name = "InvalidFileSizeError";
	}
}
