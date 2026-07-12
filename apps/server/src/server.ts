import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
	console.log(`Server running on port http://localhost:${PORT}`);
});

function shutdown() {
	console.log("Shutdown server...");
	server.close(function () {
		console.log("Server closed");
	});
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
