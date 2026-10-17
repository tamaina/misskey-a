/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';

export const CHANNEL_FEDERATION_REQUIRES_PUBLIC = '10920128-46cd-4d5d-8e66-6ae1587fab75';

export function assertFederatedChannelNote(data: {
	localOnly?: boolean | null;
	visibility?: string;
	reply?: { localOnly: boolean; visibility: string } | null;
	renote?: { localOnly: boolean; visibility: string } | null;
}, publicAllowed: boolean): void {
	const restricted = [data.reply, data.renote].some(note => note && (note.localOnly || note.visibility !== 'public'));
	if (data.localOnly || (data.visibility != null && data.visibility !== 'public') || restricted || !publicAllowed) {
		throw new IdentifiableError(CHANNEL_FEDERATION_REQUIRES_PUBLIC, 'Federated channels require public federation; local-only targets or posting policies prevent creation.');
	}
}
