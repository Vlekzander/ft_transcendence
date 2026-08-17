import ErrorComponent from "../components/ErrorComponent";

export default function NotFoundPage() {
	return (
		<ErrorComponent
			message="404 - Not found"
			button_text="Go to home"
			onClick={() => (window.location.href = "/")}
		/>
	);
}
