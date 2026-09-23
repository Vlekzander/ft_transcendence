import { Search, UserRound, Users } from "lucide-react";
import { useFriends } from "../context/FriendContext";
import { useEffect, useState } from "react";
import type { PublicUserDTO } from "@ft_transcendence/shared";
import { Link } from "react-router";
import { AVATARS_PATH } from "../../../config";
import { FriendActionButton } from "../../user/components/FriendActionButton";
import { searchUserRequest } from "../services/friends.service";
import FriendComponent from "../../user/components/Friend";

export default function FriendsPage() {
	const { friends, removeFriend } = useFriends();

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<PublicUserDTO[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		const trimmed = query.trim();
		let isCurrent = true;
		if (trimmed.length === 0) {
			const resetTimer = setTimeout(() => {
				setSearchResults([]);
				setIsSearching(false);
			}, 0);
			return () => clearTimeout(resetTimer);
		}
		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchUserRequest(trimmed);
				if (isCurrent && results.ok)
					setSearchResults(results.data ?? []);
			} catch (err) {
				if (isCurrent) {
					console.error("Search user error:", err);
					setSearchResults([]);
				}
			} finally {
				if (isCurrent) setIsSearching(false);
			}
		}, 300);

		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [query]);

	return (
		<div className="p-5 flex flex-col gap-8 justify-center">
			<div className="w-full">
				<div className="flex flex-col sm:flex-row">
					<h1 className="text-3xl font-extrabold flex items-center gap-3">
						<Users className="text-primary" size={32} />
						Friends
					</h1>
				</div>
				<div className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 self-start sm:self-auto">
					<UserRound size={16} className="text-primary" />
					<span>
						Total: <strong>{friends.length}</strong>
					</span>
				</div>
			</div>

			<section className="flex flex-col gap-3">
				<h2 className="font-bold text-xl uppercase tracking-wide text-gray-700">
					Find players
				</h2>
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
						<Search size={18} />
					</div>
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search by username..."
						className="w-full pl-10 pr-4 py-2 border border-gray-400 focus:outline-none focus:border-primary text-sm sm:text-base"
					/>
				</div>

				{query.trim().length > 0 && (
					<div className="border border-gray-300 mt-1">
						{isSearching ? (
							<p className="p-3 text-sm text-gray-500">
								Searching...
							</p>
						) : searchResults.length > 0 ? (
							<div className="divide-y divide-gray-200">
								{searchResults.map((user) => (
									<div
										key={user.uuid}
										className="flex items-center justify-between p-3 hover:bg-gray-400/5 transition-colors"
									>
										<Link
											to={`/user/${user.uuid}`}
											className="flex items-center gap-3 hover:underline"
										>
											<img
												src={
													user.avatarPath === null
														? "/assets/default_avatar.jpg"
														: AVATARS_PATH +
															user.avatarPath
												}
												alt=""
												width={36}
												height={36}
												className="w-9 h-9 object-cover border"
											/>
											<span className="font-semibold text-sm sm:text-base">
												{user.username}
											</span>
										</Link>
										<FriendActionButton uuid={user.uuid} />
									</div>
								))}
							</div>
						) : (
							<p className="p-3 text-sm text-gray-500">
								No players found for &quot;{query}&quot;
							</p>
						)}
					</div>
				)}
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="font-bold text-xl uppercase tracking-wide text-gray-700">
					All friends ({friends.length})
				</h2>
				{friends.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-3 bg-gray-200 gap-px border border-gray-200">
						{friends.map((friend) => (
							<FriendComponent
								key={friend.uuid}
								friend={friend.user}
								onDelete={() => {
									void removeFriend(friend.uuid);
								}}
							/>
						))}
						{friends.length % 3 > 0 &&
							Array.from({
								length: 3 - (friends.length % 3),
							}).map((_, index) => (
								<div
									key={index}
									className="bg-background hidden md:block"
								></div>
							))}
					</div>
				) : (
					<div className="border border-gray-300 p-8 text-center bg-background">
						<p className="text-gray-500">
							You don&apos;t have any friends yet.
						</p>
						<p className="text-sm text-gray-400 mt-1">
							Search for a player above to send a friend request.
						</p>
					</div>
				)}
			</section>
		</div>
	);
}
