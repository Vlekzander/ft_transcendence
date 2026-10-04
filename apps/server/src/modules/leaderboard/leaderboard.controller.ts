import { Request, Response, NextFunction } from "express";
import * as leaderboardService from "./leaderboard.service";

export async function getLeaderboard(
	_req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const leaderboard = await leaderboardService.getLeaderboard();

		res.status(200).json({ leaderboard });
	} catch (error) {
		next(error);
	}
}
