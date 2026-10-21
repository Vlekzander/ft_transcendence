import {
	Shield,
	Lock,
	Database,
	UserCheck,
	Mail,
	FileText,
	AlertCircle,
	RefreshCw,
	SquarePen,
} from "lucide-react";

export default function PrivacyPolicy() {
	return (
		<div className="p-4 sm:p-5 flex flex-col gap-6 max-w-5xl mx-auto w-full">
			<div className="flex items-center justify-between border-b border-gray-300 pb-4">
				<h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
					<Shield className="text-primary" size={28} />
					Privacy Policy
				</h1>
			</div>

			<div className="flex flex-col gap-6 text-foreground text-sm sm:text-base leading-relaxed">
				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<UserCheck className="text-primary" size={20} />
						1. Introduction
					</h2>
					<p className="text-gray-600">
						This Privacy Policy describes how{" "}
						<strong className="text-foreground">
							ft_transcendence
						</strong>{" "}
						collects, uses, stores, and protects your personal
						information when you access or use our platform.
					</p>
					<p className="text-gray-600 mt-1">
						ft_transcendence is an academic project developed as
						part of the 42 school curriculum. It is intended for
						demonstration and evaluation purposes.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Database className="text-primary" size={20} />
						2. Data We Collect
					</h2>
					<p className="text-gray-600">
						To provide the gaming and social features of the
						platform, we may collect and process the following data:
					</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>
							<strong className="text-foreground">
								Account and profile data:
							</strong>{" "}
							username, email address and profile avatar.
						</li>
						<li>
							<strong className="text-foreground">
								Authentication data:
							</strong>{" "}
							hashed password. We do not store passwords in plain
							text.
						</li>
						<li>
							<strong className="text-foreground">
								Game data:
							</strong>{" "}
							match history, scores, statistics, and unlocked
							achievements.
						</li>
						<li>
							<strong className="text-foreground">
								Social and communication data:
							</strong>{" "}
							friend connections, in-game chat messages, and
							private direct messages.
						</li>
					</ul>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Lock className="text-primary" size={20} />
						3. How We Use Your Data
					</h2>
					<p className="text-gray-600">
						We use your personal data only to operate and secure the
						platform, including to:
					</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>Create and manage your account.</li>
						<li>Authenticate you.</li>
						<li>
							Provide game sessions, scores, statistics, and
							achievements.
						</li>
						<li>
							Enable friend relationships, chat, and private
							messaging.
						</li>
						<li>
							Prevent abuse, cheating, and violations of our Terms
							of Service.
						</li>
						<li>Respond to support or data-related requests.</li>
					</ul>
					<p className="text-gray-600 mt-2">
						We do not sell your personal data. We do not share it
						with third parties for commercial or advertising
						purposes.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<FileText className="text-primary" size={20} />
						4. Data Sharing
					</h2>
					<p className="text-gray-600">
						Your personal data is not shared with external third
						parties.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<RefreshCw className="text-primary" size={20} />
						5. Data Retention and Deletion
					</h2>
					<p className="text-gray-600">
						We retain personal data for as long as your account
						exists and as needed to provide the service.
					</p>
					<p className="text-gray-600 mt-1">
						When you request account deletion, we will delete or
						anonymize your personal data within a reasonable
						timeframe.
					</p>
					<p className="text-gray-600 mt-1">Specifically, we will:</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2 mt-1">
						<li>
							Replace your username and email address with
							non-identifying placeholder values.
						</li>
						<li>Remove or replace your profile avatar.</li>
						<li>Delete your friend connections.</li>
						<li>Delete your private direct messages.</li>
						<li>
							Delete or anonymize personal information associated
							with your account.
						</li>
					</ul>
					<p className="text-gray-600 mt-2">
						Certain non-identifying game data, such as scores,
						statistics, achievements, and match history, may be
						retained in anonymized form to preserve leaderboard
						integrity and the accuracy of other users&apos;
						rankings.
					</p>
					<p className="text-gray-600 mt-1">
						Because rankings are calculated from the points of all
						users, deleting an account entirely could affect the
						position of other players. For this reason, deleted
						accounts may remain as anonymized records.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Shield className="text-primary" size={20} />
						6. Data Security
					</h2>
					<p className="text-gray-600">
						We store user passwords securely using strong hashing
						practices. Access to your account is protected by your
						credentials. Please use a unique password and do not
						share it with anyone.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<AlertCircle className="text-primary" size={20} />
						7. Your Rights
					</h2>
					<p className="text-gray-600">
						Depending on applicable data protection laws, including
						the GDPR where applicable, you may have the right to:
					</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>Access the personal data we process about you.</li>
						<li>
							Request rectification of inaccurate or incomplete
							data.
						</li>
						<li>Request erasure of your personal data.</li>
						<li>Request restriction of processing.</li>
						<li>Object to certain processing activities.</li>
						<li>
							Request portability of data you have provided to us,
							where applicable.
						</li>
						<li>
							Withdraw consent where processing is based on
							consent.
						</li>
					</ul>
					<p className="text-gray-600 mt-2">
						For any request regarding your personal data, contact us
						at
					</p>
					<div className="mt-2 p-3 bg-gray-100 border border-gray-300 text-foreground font-mono text-sm inline-block">
						apierret@student.42belgium.be
					</div>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<SquarePen className="text-primary" size={20} />
						8. Changes to This Policy
					</h2>
					<p className="text-gray-600">
						We may update this Privacy Policy to reflect changes in
						the platform or applicable requirements. The latest
						version will always be available on the platform.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Mail className="text-primary" size={20} />
						9. Contact
					</h2>
					<p className="text-gray-600">
						For any question about this Privacy Policy or the
						processing of your personal data, contact:
					</p>
					<div className="mt-2 p-3 bg-gray-100 border border-gray-300 text-foreground font-mono text-sm inline-block">
						apierret@student.42belgium.be
					</div>
				</section>
			</div>
		</div>
	);
}
