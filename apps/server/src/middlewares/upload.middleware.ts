import multer, { FileFilterCallback } from "multer";
import {
	InvalidFileError,
	InvalidFileSizeError,
	InvalidFileTypeError,
} from "../errors";
import { NextFunction, Request, Response } from "express";
import path from "node:path";
import { AVATAR_DIR } from "../config/upload.config";

const MAX_FILE_SIZE_MB = 5;

const avatarFilter = (
	_req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback,
) => {
	if (file.mimetype.startsWith("image/")) cb(null, true);
	else cb(new InvalidFileTypeError());
};

const storageAvatar = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, AVATAR_DIR);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		const uuidName = crypto.randomUUID() + ext;
		cb(null, uuidName);
	},
});

const avatar = multer({
	storage: storageAvatar,
	fileFilter: avatarFilter,
	limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

export function uploadAvatar(req: Request, res: Response, next: NextFunction) {
	avatar.single("file")(req, res, (err: unknown) => {
		if (err instanceof multer.MulterError) {
			if (err.code === "LIMIT_FILE_SIZE")
				return next(new InvalidFileSizeError(MAX_FILE_SIZE_MB));
			if (err.code === "LIMIT_UNEXPECTED_FILE")
				return next(new InvalidFileError("Invalid file error"));
			return next(err);
		}
		console.log(err);
		if (err) return next(err);
		next();
	});
}
