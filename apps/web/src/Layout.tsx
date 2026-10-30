import { Outlet } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Layout() {
	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			<Header />
			<main className="flex flex-col grow min-h-0">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
