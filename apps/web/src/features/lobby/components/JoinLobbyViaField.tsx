import { useState } from "react";

type Props = {
  onJoin: (joinCode: string) => void;
  error?: string | null;
};

export default function JoinLobbyField({ onJoin, error }: Props) {
	const [joinCode, setJoinCode] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (joinCode.length === 6) onJoin(joinCode);
	};

	return (
		<form onSubmit={handleSubmit} className="flex">
			<input
				value={joinCode}
				onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
				maxLength={6}
				placeholder="Join Code"
				className="px-3 border border-gray-400 border-r-0 font-space-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
			/>
			<button
				type="submit"
				className="px-3 border border-gray-400 hover:bg-gray-400/10 cursor-pointer text-sm font-semibold"
			>
				Join
			</button>
			{error && <p className="form-alert-error ml-2 self-center">{error}</p>}
		</form>
	);
}