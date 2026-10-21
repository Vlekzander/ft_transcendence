import {
	FileText,
	ShieldAlert,
	CheckCircle,
	Lock,
	Users,
	Wrench,
	Ban,
	RefreshCw,
	Mail,
} from "lucide-react";

export default function TermsOfService() {
	return (
		<div className="p-4 sm:p-5 flex flex-col gap-6 max-w-5xl mx-auto w-full">
			<div className="flex items-center justify-between border-b border-gray-300 pb-4">
				<h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
					<FileText className="text-primary" size={28} />
					Terms of Service
				</h1>
			</div>

			<div className="flex flex-col gap-6 text-foreground text-sm sm:text-base leading-relaxed">
				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<CheckCircle className="text-primary" size={20} />
						1. Acceptance of Terms
					</h2>
					<p className="text-gray-600">
						These Terms of Service (&quot;Terms&quot;) govern your
						access to and use of the{" "}
						<strong className="text-foreground">
							ft_transcendence
						</strong>{" "}
						platform. By accessing or using the platform, or by
						creating an account, you agree to be bound by these
						Terms.
					</p>
					<p className="text-gray-600 mt-1">
						ft_transcendence is an academic project developed as
						part of the 42 school curriculum. It is intended for
						demonstration and evaluation purposes.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Users className="text-primary" size={20} />
						2. Description of the Service
					</h2>
					<p className="text-gray-600">
						The platform provides an online drawing and guessing
						game experience, including:
					</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>
							User account creation and management, including a
							username, email address, and custom or default
							avatar.
						</li>
						<li>
							Public and private game lobbies for drawing,
							guessing, and competing against other registered
							users.
						</li>
						<li>
							A friend system and progression tracking through
							achievements.
						</li>
						<li>
							An in-game chat used for guessing words and
							interacting during matches.
						</li>
						<li>Private direct messaging between users.</li>
					</ul>
					<p className="text-gray-600 mt-2">
						We may modify, suspend, or discontinue part or all of
						the service at any time, particularly for maintenance,
						evaluation, or academic constraints.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Lock className="text-primary" size={20} />
						3. Account Security
					</h2>
					<p className="text-gray-600">
						You are responsible for maintaining the confidentiality
						of your account credentials, password, and
						authentication tokens. Any action performed through your
						account is presumed to have been performed by you,
						unless you can demonstrate unauthorized access. If you
						believe your account has been compromised, you should
						change your password immediately and contact us.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Ban className="text-primary" size={20} />
						4. Acceptable Use
					</h2>
					<p className="text-gray-600">
						You agree to use the platform respectfully and lawfully.
						You must not use the game chat, private messages,
						drawing tools, usernames, avatars, or any other feature
						to transmit, display, or promote:
					</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>
							Abusive, hateful, racist, harassing, threatening,
							sexually explicit, or discriminatory content.
						</li>
						<li>
							Illegal content or content that infringes the rights
							of others.
						</li>
						<li>
							Spam, scams, phishing, malware, or misleading links.
						</li>
						<li>
							Content intended to disturb other users or disrupt
							game sessions.
						</li>
					</ul>
					<p className="text-gray-600 mt-2">You must also not:</p>
					<ul className="list-disc list-inside text-gray-600 flex flex-col gap-1 pl-2">
						<li>
							Share the secret word outside of authorized guesses.
						</li>
						<li>
							Cheat, exploit bugs, use unauthorized automation, or
							attempt to gain an unfair advantage.
						</li>
						<li>
							Attempt to access, modify, disrupt,
							reverse-engineer, or compromise the platform, its
							infrastructure, or other users&apos; accounts.
						</li>
						<li>
							Impersonate another user or misrepresent your
							affiliation with the project.
						</li>
					</ul>
					<p className="text-gray-600 mt-2">
						We may warn, suspend, restrict, or delete an account
						that violates these Terms, particularly in case of
						serious or repeated violations.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Wrench className="text-primary" size={20} />
						5. User Content
					</h2>
					<p className="text-gray-600">
						You retain ownership of the content you create or
						submit, including drawings, messages, profile
						information, and avatars. By using the platform, you
						grant us a limited, non-exclusive, royalty-free license
						to store, display, transmit, and process this content
						solely for the purpose of operating and improving the
						service. You are solely responsible for the content you
						submit. We may remove content that violates these Terms.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<ShieldAlert className="text-primary" size={20} />
						6. Availability and Liability
					</h2>
					<p className="text-gray-600">
						The platform is provided on an &quot;as is&quot; and
						&quot;as available&quot; basis, without warranties of
						any kind, express or implied. We do not guarantee that
						the service will be uninterrupted, error-free, secure,
						or available at all times. To the maximum extent
						permitted by applicable law, we shall not be liable for
						any data loss, service interruption, indirect damages,
						or damages arising from your use of the platform.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Ban className="text-primary" size={20} />
						7. Termination
					</h2>
					<p className="text-gray-600">
						When an account is deleted, personal data and private
						messages are removed or anonymized. Non-identifying game
						data may be retained to preserve leaderboard integrity.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<RefreshCw className="text-primary" size={20} />
						8. Changes to These Terms
					</h2>
					<p className="text-gray-600">
						We may update these Terms to reflect changes in the
						platform or applicable requirements. The latest version
						will always be available on the platform. Continued use
						of the platform after changes are published constitutes
						acceptance of the updated Terms.
					</p>
				</section>

				<section className="flex flex-col gap-2 border border-gray-300 p-4 sm:p-6 bg-background">
					<h2 className="font-bold text-lg sm:text-xl uppercase tracking-wide text-gray-700 flex items-center gap-2">
						<Mail className="text-primary" size={20} />
						9. Contact
					</h2>
					<p className="text-gray-600">
						For any question about these Terms, contact:
					</p>
					<div className="mt-2 p-3 bg-gray-100 border border-gray-300 text-foreground font-mono text-sm inline-block">
						apierret@student.42belgium.be
					</div>
				</section>
			</div>
		</div>
	);
}
