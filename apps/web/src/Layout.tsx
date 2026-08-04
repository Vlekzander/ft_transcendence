import { Outlet } from "react-router";

export default function Layout() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="bg-red-500">TODO FOOTER</header>
			<main className="grow flex flex-col">
				<Outlet />
			</main>
			<footer className="bg-blue-400">TODO FOOTER</footer>
		</div>
	);
}
