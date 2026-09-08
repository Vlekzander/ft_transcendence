import { useState } from "react";
import { uploadAvatar } from "../services/editApi";
import { useAuth } from "../../auth/context/AuthContext";
import type { ApiResult } from "../../../shared/types/api";
import { AVATARS_PATH, DEFAULT_AVATAR } from "../../../config";

const MAX_FILE_SIZE_MB = 5;

export default function EditAvatarForm() {
	const { user, refreshUser } = useAuth();

	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const [serverError, setServerError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setServerError("");
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/"))
			return setServerError("Invalid file type");
		if (file.size > 5 * 1024 * 1024)
			return setServerError(
				`Invalid file size (max: ${MAX_FILE_SIZE_MB} MB)`,
			);

		const url = URL.createObjectURL(file);
		setAvatarFile(file);
		setAvatarPreview(url);
	};

	const handleSubmit = async () => {
		setServerError("");
		if (!avatarFile) return setServerError("No avatar selected");

		setIsSubmitting(true);

		const result: ApiResult = await uploadAvatar(user.uuid, avatarFile);
		setIsSubmitting(false);

		if (result.ok === false) {
			setServerError(result.error);
			return;
		}

		await refreshUser();
		setAvatarFile(null);

		if (avatarPreview) {
			URL.revokeObjectURL(avatarPreview);
			setAvatarPreview(null);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			className="border flex flex-col items-center"
		>
			<h2>Edit Avatar</h2>
			<p className="min-h-5 text-sm text-red-500">{serverError || " "}</p>
			<img
				src={
					avatarPreview
						? avatarPreview
						: user.avatarPath
							? `${AVATARS_PATH}/${user.avatarPath}`
							: DEFAULT_AVATAR
				}
				alt="Avatar preview"
				className="h-32 w-32 object-cover mb-3"
			/>
			<input
				type="file"
				accept="image/*"
				onChange={handleAvatarChange}
				disabled={isSubmitting}
			/>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Editing avatar..." : "Edit avatar"}
			</button>
		</form>
	);
}
