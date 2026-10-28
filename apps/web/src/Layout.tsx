import { Link, Outlet } from "react-router";
import { useAuth } from "./features/auth/context/AuthContext";

export default function Layout() {
	const { user } = useAuth();

	return (
		<div className="flex flex-col min-h-screen">
			<header className="flex justify-between bg-red-500">
				<span>TODO HEADER - {user ? user.username : "Guest"}</span>
				<Link to="/lobbies">Lobbies</Link>
			</header>
			<main className="flex flex-col grow">
				<Outlet />
			</main>
			<footer className="bg-blue-400">TODO FOOTER</footer>
		</div>
	);
}
