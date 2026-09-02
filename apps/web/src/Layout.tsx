import { Outlet } from "react-router";
import { useAuth } from "./features/auth/context/AuthContext";

export default function Layout() {
	const { user } = useAuth();

	return (
		<div className="flex flex-col min-h-screen">
			<header className="bg-red-500">
				TODO HEADER - {user ? user.username : "Guest"}
			</header>
			<main className="flex flex-col grow">
				<Outlet />
			</main>
			<footer className="bg-blue-400">TODO FOOTER</footer>
		</div>
	);
}
