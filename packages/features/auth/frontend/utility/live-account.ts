/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Tokens that represent the same live login after a native-to-session upgrade. */
const aliases = new Map<string, Set<string>>();

export function resetLiveTokens(userId: string, token: string) {
	aliases.clear();
	aliases.set(userId, new Set([token]));
}

export function adoptLiveToken(userId: string, previous: string, next: string) {
	const set = aliases.get(userId) ?? new Set<string>();
	set.add(previous);
	set.add(next);
	aliases.set(userId, set);
}

export function isSameLiveCredential(ownerId: string, ownerToken: string, currentId: string | null | undefined, currentToken: string | null | undefined) {
	if (!currentId || !currentToken || currentId !== ownerId) return false;
	if (currentToken === ownerToken) return true;
	const set = aliases.get(ownerId);
	return !!set && set.has(ownerToken) && set.has(currentToken);
}
