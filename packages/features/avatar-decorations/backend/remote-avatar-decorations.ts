/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ipaddr from 'ipaddr.js';
import type { MiRemoteUser, MiUser } from '@features/users/backend/models/User.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

type RemoteActor = Pick<MiRemoteUser, 'uri' | 'host' | 'username'>;
type RemoteDecoration = MiUser['avatarDecorations'][number] & { url: string };

// Tempura's API-assisted actor refresh, adapted without catalog auto-import:
// https://github.com/lqvp/misskey-tempura/commit/eb8ab2bd0ee54b1335d2deacb840f57801684b2b

function publicHttpsUrl(value: unknown): URL | undefined {
	if (typeof value !== 'string' || value.length > 1024) return;
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 1024) return;
		const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
		if (!hostname.includes('.') && !hostname.includes(':')) return;
		if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return;
		if (ipaddr.isValid(hostname) && ipaddr.process(hostname).range() !== 'unicast') return;
		return url;
	} catch {
		return;
	}
}

/** Only copy fields understood by our renderer. No remote catalog entries are created. */
export function normalizeRemoteAvatarDecorations(value: unknown): RemoteDecoration[] | undefined {
	if (!Array.isArray(value)) return;
	const result: RemoteDecoration[] = [];
	for (const row of value.slice(0, 16)) {
		if (row == null || typeof row !== 'object' || Array.isArray(row)) continue;
		const decoration = row as Record<string, unknown>;
		if (typeof decoration.id !== 'string' || !/^[a-zA-Z0-9]{1,128}$/.test(decoration.id)) continue;
		const url = publicHttpsUrl(decoration.url);
		if (url == null) continue;
		if (decoration.flipH != null && typeof decoration.flipH !== 'boolean') continue;
		if (['angle', 'offsetX', 'offsetY'].some(key => {
			const v = decoration[key];
			return v != null && (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > (key === 'angle' ? 0.5 : 0.25));
		})) continue;
		result.push({
			id: decoration.id,
			url: url.href,
			angle: (decoration.angle as number | null | undefined) ?? 0,
			flipH: (decoration.flipH as boolean | null | undefined) ?? false,
			offsetX: (decoration.offsetX as number | null | undefined) ?? 0,
			offsetY: (decoration.offsetY as number | null | undefined) ?? 0,
		});
	}
	return result;
}

/** Tempura-compatible API side channel, refreshed with the validated AP actor. */
export async function fetchRemoteAvatarDecorations(
	actor: RemoteActor,
	http: Pick<HttpRequestService, 'postPublicJson'>,
	isFederationAllowedHost: (host: string) => boolean,
): Promise<RemoteDecoration[] | undefined> {
	const uri = publicHttpsUrl(actor.uri);
	if (uri == null || uri.host !== actor.host || !isFederationAllowedHost(uri.host)) return;
	const endpoint = new URL('/api/users/show', uri);
	try {
		// The API must describe this server's local actor, never a cached third party.
		const data = await http.postPublicJson(endpoint.href, JSON.stringify({ username: actor.username }));
		if (data == null || typeof data !== 'object' || Array.isArray(data)) return;
		const user = data as Record<string, unknown>;
		if (user.host != null || typeof user.username !== 'string' || user.username.toLowerCase() !== actor.username.toLowerCase()) return;
		if (user.uri != null && user.uri !== actor.uri) return;
		return normalizeRemoteAvatarDecorations(user.avatarDecorations);
	} catch {
		// Unsupported APIs, HTTP failures and malformed replies preserve the last good state.
		return;
	}
}

/** Serve untrusted media through the image proxy, without a direct-origin fallback. */
export function packRemoteAvatarDecorations(value: MiUser['avatarDecorations'], mediaProxy: string) {
	return (normalizeRemoteAvatarDecorations(value) ?? []).map(decoration => {
		const url = new URL(`${mediaProxy}/image.webp`);
		url.searchParams.set('url', decoration.url);
		return { ...decoration, url: url.href };
	});
}
