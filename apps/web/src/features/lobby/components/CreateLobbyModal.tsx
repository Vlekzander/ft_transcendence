import CreateLobbyForm from "./CreateLobbyForm";

type CreateLobbyModalProps = {
	onClose: () => void;
};

export default function CreateLobbyModal({ onClose }: CreateLobbyModalProps) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Create a lobby"
		>
			<CreateLobbyForm
				onCancel={onClose}
				className="max-h-full overflow-y-auto"
			/>
		</div>
	);
}
