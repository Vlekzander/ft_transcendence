type ErrorComponentProp = {
	message: string;
	button_text: string;
	onClick: () => void;
};

export default function ErrorComponent({
	message,
	button_text,
	onClick,
}: ErrorComponentProp) {
	return (
		<div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
			<h2 className="text-2xl font-bold text-red-500">Oops !</h2>
			<p className="text-gray-600">{message}</p>
			<button
				type="button"
				onClick={() => onClick()}
				className="bg-primary/10 text-primary/90 border border-primary font-semibold flex gap-2 px-2 py-1.5 hover:bg-primary/20 cursor-pointer"
			>
				{button_text}
			</button>
		</div>
	);
}
