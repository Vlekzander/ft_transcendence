import { beforeEach, describe, expect, it, vi } from "vitest";
import multer from "multer";
import { uploadAvatar } from "@/middlewares/upload.middleware";
import {
	InvalidFileError,
	InvalidFileSizeError,
	InvalidFileTypeError,
	NoFileUploadError,
} from "@/errors";

let mockSingleHandler: (req: any, res: any, cb: (err?: any) => void) => void;

vi.mock("multer", () => {
	const multerMock: any = vi.fn(() => ({
		single: vi.fn(() => (req: any, res: any, cb: (err?: any) => void) => {
			mockSingleHandler(req, res, cb);
		}),
	}));

	multerMock.diskStorage = vi.fn(() => ({}));

	class MulterError extends Error {
		code: string;
		constructor(code: string) {
			super(code);
			this.name = "MulterError";
			this.code = code;
		}
	}
	multerMock.MulterError = MulterError;

	return {
		default: multerMock,
	};
});

describe("middlewares/upload.middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Calls next without error when a valid file is provided", () => {
		mockSingleHandler = (req, _res, cb) => {
			req.file = {
				filename: "test-uuid.png",
				mimetype: "image/png",
			};
			cb();
		};

		const req = {} as any;
		const next = vi.fn();

		uploadAvatar(req, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
	});

	it("Calls next with NoFileUploadError when req.file is missing", () => {
		mockSingleHandler = (req, _res, cb) => {
			req.file = undefined;
			cb();
		};

		const req = {} as any;
		const next = vi.fn();

		uploadAvatar(req, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toBeInstanceOf(NoFileUploadError);
	});

	it("Calls next with InvalidFileSizeError when Multer reports LIMIT_FILE_SIZE", () => {
		mockSingleHandler = (_req, _res, cb) => {
			cb(new multer.MulterError("LIMIT_FILE_SIZE"));
		};

		const next = vi.fn();

		uploadAvatar({} as any, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toBeInstanceOf(InvalidFileSizeError);
		expect(next.mock.calls[0][0].message).toContain("5 MB");
	});

	it("Calls next with InvalidFileError when Multer reports LIMIT_UNEXPECTED_FILE", () => {
		mockSingleHandler = (_req, _res, cb) => {
			cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
		};

		const next = vi.fn();

		uploadAvatar({} as any, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toBeInstanceOf(InvalidFileError);
		expect(next.mock.calls[0][0].message).toBe("Invalid file error");
	});

	it("Forwards unhandled MulterError to next", () => {
		const genericMulterError = new multer.MulterError("LIMIT_PART_COUNT");
		mockSingleHandler = (_req, _res, cb) => {
			cb(genericMulterError);
		};

		const next = vi.fn();

		uploadAvatar({} as any, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith(genericMulterError);
	});

	it("Forwards custom filter errors (such as InvalidFileTypeError) to next", () => {
		const fileTypeError = new InvalidFileTypeError();
		mockSingleHandler = (_req, _res, cb) => {
			cb(fileTypeError);
		};

		const next = vi.fn();

		uploadAvatar({} as any, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toBeInstanceOf(InvalidFileTypeError);
	});

	it("Forwards generic unexpected errors to next", () => {
		const error = new Error("Disk full");
		mockSingleHandler = (_req, _res, cb) => {
			cb(error);
		};

		const next = vi.fn();

		uploadAvatar({} as any, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith(error);
	});
});
