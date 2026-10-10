type ActiveLobbyPromptProps = {
	error: string | null;
	isBusy: boolean;
	onContinue: () => void;
	onBack: () => void;
};

export default function ActiveLobbyPrompt({
	error,
	isBusy,
	onContinue,
	onBack,
}: ActiveLobbyPromptProps) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="active-lobby-title"
		>
			<div className="form-card">
				<h2 id="active-lobby-title" className="form-title">
					Already in a lobby
				</h2>
				<p className="text-sm sm:text-base">
					You are already connected to a lobby. Do you want to join it
					back or continue?
				</p>
				<p className="text-xs text-gray-500">
					Continuing will make you leave your current lobby.
				</p>

				{error && <p className="form-alert-error">{error}</p>}

				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={onContinue}
						disabled={isBusy}
						className="px-5 py-2.5 border border-gray-400 font-semibold text-sm sm:text-base hover:bg-gray-400/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isBusy ? "Leaving..." : "Continue"}
					</button>
					<button
						type="button"
						onClick={onBack}
						disabled={isBusy}
						className="btn-primary"
					>
						Back to lobby
					</button>
				</div>
			</div>
		</div>
	);
}
