import { Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";

const usersRouter = Router();

usersRouter.get("/:uuid/history", async (req, res) => {
	const uuid = req.params.uuid;

	const history =
		await DataManagerSingleton.getInstance().getUserHistory(uuid);

	res.json({ history });
});

export default usersRouter;
