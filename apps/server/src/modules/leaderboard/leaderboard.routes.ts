import { Router } from "express";
import * as leaderboardController from "./leaderboard.controller";

const leaderboardRouter = Router();

leaderboardRouter.get("/", leaderboardController.getLeaderboard);

export default leaderboardRouter;
