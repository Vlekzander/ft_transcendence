import { Outlet } from "react-router";

export default function Layout() {
	return (
		<div className="flex flex-col min-h-screen">
			<header className="bg-red-500">TODO HEADER</header>
			<main className="flex flex-col grow">
				<Outlet />
			</main>
			<footer className="bg-blue-400">TODO FOOTER</footer>
		</div>
	);
}
