import { Link } from "react-router";
import { Shield, FileText } from "lucide-react";

export default function Footer() {
	return (
		<footer className="border-t border-gray-300 bg-background text-gray-600 text-sm py-6 px-6 mt-auto">
			<div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
				<div className="flex flex-col items-center md:items-start gap-1">
					<span className="font-semibold text-foreground">
						ft_transcendence
					</span>
					<p className="text-xs text-gray-500">
						Academic project at 42 School. Designed for
						demonstration purposes.
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
					<Link
						to="/privacy"
						className="hover:underline flex items-center gap-1"
					>
						<Shield size={14} className="text-primary" />
						Privacy Policy
					</Link>
					<Link
						to="/tos"
						className="hover:underline flex items-center gap-1"
					>
						<FileText size={14} className="text-primary" />
						Terms of Service
					</Link>
				</div>
			</div>
		</footer>
	);
}
