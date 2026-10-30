import { Link } from "react-router";
import { useAuth } from "../features/auth/context/AuthContext";
import { getAvatarUrl } from "../config";
import {
	Users,
	Trophy,
	MessageSquare,
	Gamepad2,
	LogOut,
	LogIn,
	UserPlus,
	Menu,
	X,
	Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NEAR_TOP_PX = 64;
const SCROLL_THRESHOLD_PX = 10;

export default function Header() {
	const { user } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [headerHidden, setHeaderHidden] = useState(false);
	const lastScrollY = useRef(0);

	const closeMenu = () => setMobileMenuOpen(false);

	useEffect(() => {
		const onScroll = () => {
			const y = window.scrollY;
			if (y < NEAR_TOP_PX) {
				setHeaderHidden(false);
				lastScrollY.current = y;
				return;
			}
			const delta = y - lastScrollY.current;
			if (Math.abs(delta) < SCROLL_THRESHOLD_PX) return;
			setHeaderHidden(delta > 0);
			lastScrollY.current = y;
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!mobileMenuOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileMenuOpen(false);
		};
		const noBurger = window.matchMedia(
			user ? "(min-width: 768px)" : "(min-width: 640px)",
		);
		const onNoBurgerChange = () => {
			if (noBurger.matches) setMobileMenuOpen(false);
		};

		window.addEventListener("keydown", onKeyDown);
		noBurger.addEventListener("change", onNoBurgerChange);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
			noBurger.removeEventListener("change", onNoBurgerChange);
		};
	}, [mobileMenuOpen, user]);

	return (
		<header
			className={`sticky top-0 z-50 flex flex-col border-b border-gray-300 bg-background shadow-sm transition-transform duration-300 ${headerHidden && !mobileMenuOpen ? "max-sm:-translate-y-full short:-translate-y-full" : ""}`}
		>
			<div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-background">
				<Link
					to="/"
					onClick={closeMenu}
					className="flex items-center gap-2 text-lg sm:text-xl font-extrabold tracking-wide"
				>
					<span className="uppercase">ft_transcendence</span>
				</Link>

				<nav className="hidden md:flex items-center gap-6 font-medium text-sm">
					<Link
						to="/leaderboard"
						className="hover:text-primary transition-colors"
					>
						Leaderboard
					</Link>
					{user && (
						<>
							<Link
								to="/lobbies"
								className="hover:text-primary transition-colors"
							>
								Lobbies
							</Link>
							<Link
								to="/friends"
								className="hover:text-primary transition-colors"
							>
								Friends
							</Link>
							<Link
								to="/msg"
								className="hover:text-primary transition-colors"
							>
								Messages
							</Link>
							<Link
								to="/account"
								className="hover:text-primary transition-colors"
							>
								Account
							</Link>
						</>
					)}
				</nav>

				<div className="flex items-center gap-3">
					{user ? (
						<div className="flex items-center gap-3">
							<Link
								to={`/user/${user.uuid}`}
								onClick={closeMenu}
								className="flex items-center gap-2 hover:opacity-85 transition-opacity"
							>
								<img
									src={getAvatarUrl(user.avatarPath)}
									alt={user.username}
									className="w-8 h-8 object-cover border border-gray-300"
								/>
								<span className="hidden sm:inline font-semibold text-sm">
									{user.username}
								</span>
							</Link>
							<div className="hidden sm:block h-5 w-px bg-gray-300 mx-1" />
							<Link
								to="/logout"
								title="Logout"
								className="hidden sm:block p-2 text-gray-600 hover:text-red-500 transition-colors"
							>
								<LogOut size={18} />
							</Link>
						</div>
					) : (
						<div className="hidden sm:flex items-center gap-2">
							<Link
								to="/leaderboard"
								title="Leaderboard"
								aria-label="Leaderboard"
								className="md:hidden p-2 hover:opacity-80 transition-opacity"
							>
								<Trophy size={18} className="text-primary" />
							</Link>
							<Link
								to="/login"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 hover:bg-gray-100 transition-colors"
							>
								<LogIn size={16} />
								Login
							</Link>
							<Link
								to="/register"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
							>
								<UserPlus size={16} />
								Register
							</Link>
						</div>
					)}

					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className={`${user ? "md:hidden" : "sm:hidden"} p-2 text-gray-700 hover:text-primary transition-colors focus:outline-none`}
						aria-label="Toggle menu"
					>
						{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>

			{mobileMenuOpen && (
				<div
					aria-hidden="true"
					onClick={closeMenu}
					className="md:hidden fixed inset-0 -z-10 bg-black/40"
				/>
			)}

			{mobileMenuOpen && (
				<div className="md:hidden absolute top-full left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto flex flex-col border-t border-gray-200 bg-background px-4 py-4 gap-3 text-base shadow-inner">
					{user && (
						<Link
							to={`/user/${user.uuid}`}
							onClick={closeMenu}
							className="flex sm:hidden items-center gap-3 py-2 border-b border-gray-100 font-semibold"
						>
							<img
								src={getAvatarUrl(user.avatarPath)}
								alt={user.username}
								className="w-8 h-8 object-cover border border-gray-300"
							/>
							<span>{user.username}</span>
						</Link>
					)}

					<Link
						to="/leaderboard"
						onClick={closeMenu}
						className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
					>
						<Trophy size={18} className="text-primary" />
						Leaderboard
					</Link>

					{user && (
						<>
							<Link
								to="/lobbies"
								onClick={closeMenu}
								className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
							>
								<Gamepad2 size={18} className="text-primary" />
								Lobbies
							</Link>
							<Link
								to="/friends"
								onClick={closeMenu}
								className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
							>
								<Users size={18} className="text-primary" />
								Friends
							</Link>
							<Link
								to="/msg"
								onClick={closeMenu}
								className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
							>
								<MessageSquare
									size={18}
									className="text-primary"
								/>
								Messages
							</Link>
							<Link
								to="/account"
								onClick={closeMenu}
								className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
							>
								<Settings size={18} className="text-primary" />
								Account
							</Link>
						</>
					)}

					<div
						className={`${user ? "flex sm:hidden" : "flex"} pt-2 mt-2 border-t border-gray-200 flex-col gap-2`}
					>
						{user ? (
							<Link
								to="/logout"
								onClick={closeMenu}
								className="flex items-center gap-2 py-2 text-red-600 font-medium hover:opacity-80"
							>
								<LogOut size={18} />
								Logout
							</Link>
						) : (
							<div className="flex flex-col gap-2">
								<Link
									to="/login"
									onClick={closeMenu}
									className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 font-medium hover:bg-gray-100 transition-colors"
								>
									<LogIn size={18} />
									Login
								</Link>
								<Link
									to="/register"
									onClick={closeMenu}
									className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
								>
									<UserPlus size={18} />
									Register
								</Link>
							</div>
						)}
					</div>
				</div>
			)}
		</header>
	);
}
