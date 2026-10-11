import { useEffect, useState } from "react";
import type { PublicUserDTO } from "@ft_transcendence/shared";
import { getUser } from "../../user/services/user.service";

const cache = new Map<string, PublicUserDTO>();

export function useUsers(uuids: string[]): Record<string, PublicUserDTO> {
	const [users, setUsers] = useState<Record<string, PublicUserDTO>>({});
	const key = Array.from(new Set(uuids)).sort().join(",");

	useEffect(() => {
		let isCurrent = true;
		const ids = key ? key.split(",") : [];

		const load = async () => {
			await Promise.all(
				ids
					.filter((id) => !cache.has(id))
					.map(async (id) => {
						const res = await getUser(id);
						if (res.ok) cache.set(id, res.data);
					}),
			);
			if (!isCurrent) return;
			const resolved: Record<string, PublicUserDTO> = {};
			for (const id of ids) {
				const user = cache.get(id);
				if (user) resolved[id] = user;
			}
			setUsers(resolved);
		};
		void load();

		return () => {
			isCurrent = false;
		};
	}, [key]);

	return users;
}
