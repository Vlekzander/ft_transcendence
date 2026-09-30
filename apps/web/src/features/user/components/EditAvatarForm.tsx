import { useState } from "react";
import { uploadAvatar } from "../services/editApi";
import { useAuth } from "../../auth/context/AuthContext";
import type { ApiResult } from "../../../shared/types/api";
import { getAvatarUrl } from "../../../config";
import { ImageIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router";

const MAX_FILE_SIZE_MB = 5;

export default function EditAvatarForm() {
	const navigate = useNavigate();
	const { user, refreshUser } = useAuth();

	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const [serverError, setServerError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!user) {
		navigate("/");
		return;
	}

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
			className="form-card"
		>
			<h2 className="form-title">
				<ImageIcon className="text-primary" size={28} />
				Edit Avatar
			</h2>
			{serverError && (
				<div className="form-alert-error">{serverError}</div>
			)}
			<div className="flex flex-col sm:flex-row items-center gap-6 my-2">
				<div className="w-32 h-32 shrink-0 border border-gray-400 bg-gray-100 flex items-center justify-center overflow-hidden">
					<img
						src={
							avatarPreview
								? avatarPreview
								: getAvatarUrl(user.avatarPath)
						}
						alt="Avatar preview"
						className="h-full w-full object-cover"
					/>
				</div>
				<div className="form-field flex-1 w-full">
					<label htmlFor="avatar-file" className="form-label">
						Upload image (max {MAX_FILE_SIZE_MB} MB)
					</label>
					<input
						id="avatar-file"
						type="file"
						accept="image/*"
						onChange={handleAvatarChange}
						disabled={isSubmitting}
						className="form-input file:mr-4 file:py-1 file:px-3 file:border-0 file:bg-gray-200 file:text-foreground file:font-semibold hover:file:bg-gray-300 cursor-pointer"
					/>
				</div>
			</div>
			<button
				type="submit"
				disabled={isSubmitting || !avatarFile}
				className="btn-primary mt-2"
			>
				<Upload size={18} />
				{isSubmitting ? "Editing avatar..." : "Edit avatar"}
			</button>
		</form>
	);
}
