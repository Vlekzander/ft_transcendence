import EditAccountForm from "../components/EditAccountForm";
import EditAvatarForm from "../components/EditAvatarForm";

export default function AccountPage() {
	return (
		<div className="grow flex flex-col gap-8 justify-center items-center">
			<EditAvatarForm />
			<EditAccountForm />
		</div>
	);
}
