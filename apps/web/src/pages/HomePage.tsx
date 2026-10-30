import { Link } from "react-router";
import { useAuth } from "../features/auth/context/AuthContext";
import {
	Gamepad2,
	Trophy,
	Users,
	Sparkles,
	ArrowRight,
	LogIn,
	UserPlus,
} from "lucide-react";

export default function HomePage() {
	const { user } = useAuth();

	return (
		<div className="flex flex-col items-center justify-center grow p-6 max-w-5xl mx-auto w-full text-center my-auto">
			<div className="flex flex-col items-center gap-4 max-w-2xl py-8">
				<div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-semibold uppercase tracking-wider">
					<Sparkles size={16} />
					Academic Project 42
				</div>

				<h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
					Draw, Guess & <span className="text-primary">Compete</span>
				</h1>

				<p className="text-base sm:text-lg text-gray-600 leading-relaxed">
					Welcome to{" "}
					<strong className="text-foreground">
						ft_transcendence
					</strong>
					, the real-time multiplayer drawing and guessing platform.
					Challenge your friends, climb the leaderboard, and showcase
					your artistic skills!
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-4 mt-2 mb-12">
				{user ? (
					<>
						<Link
							to="/lobbies"
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all shadow-sm"
						>
							<Gamepad2 size={20} />
							Join a Lobby
							<ArrowRight size={18} />
						</Link>
						<Link
							to="/leaderboard"
							className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 font-semibold text-base hover:bg-gray-100 transition-all"
						>
							<Trophy size={20} className="text-yellow-500" />
							View Leaderboard
						</Link>
					</>
				) : (
					<>
						<Link
							to="/register"
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all shadow-sm"
						>
							<UserPlus size={20} />
							Create Account
							<ArrowRight size={18} />
						</Link>
						<Link
							to="/login"
							className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 font-semibold text-base hover:bg-gray-100 transition-all"
						>
							<LogIn size={20} />
							Login
						</Link>
					</>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8 border-t border-gray-300 text-left">
				<div className="flex flex-col gap-2 p-5 border border-gray-300 bg-background shadow-2xs">
					<div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary mb-1">
						<Gamepad2 size={24} />
					</div>
					<h2 className="font-bold text-lg">Live Matches</h2>
					<p className="text-sm text-gray-600">
						Create or join public and private lobbies to draw and
						guess words in real-time with other players.
					</p>
				</div>

				<div className="flex flex-col gap-2 p-5 border border-gray-300 bg-background shadow-2xs">
					<div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary mb-1">
						<Trophy size={24} />
					</div>
					<h2 className="font-bold text-lg">Leaderboard & Scores</h2>
					<p className="text-sm text-gray-600">
						Track your stats, unlock achievements, and aim for the
						top spot on the global leaderboard.
					</p>
				</div>

				<div className="flex flex-col gap-2 p-5 border border-gray-300 bg-background shadow-2xs">
					<div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary mb-1">
						<Users size={24} />
					</div>
					<h2 className="font-bold text-lg">Social & Chat</h2>
					<p className="text-sm text-gray-600">
						Add friends, exchange private direct messages, and
						review your complete match history.
					</p>
				</div>
			</div>
		</div>
	);
}
