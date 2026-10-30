import { Request, Response, NextFunction } from "express";
import * as achievementsService from "./achievements.service";

export async function getUserAchievements(
	req: Request<{ uuid: string }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.params;

		const achievements =
			await achievementsService.getUserAchievements(uuid);

		return res.status(200).json({ achievements });
	} catch (error) {
		next(error);
	}
}
