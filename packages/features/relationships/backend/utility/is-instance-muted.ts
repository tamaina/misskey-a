/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiNote } from '@features/notes/backend/models/Note.js';
import type { Packed } from '@features/index/contract/packed.js';

export function isInstanceMuted(note: Packed<'Note'> | MiNote, mutedInstances: Set<string>): boolean {
	if (mutedInstances.has(note.user?.host ?? '')) return true;
	if (mutedInstances.has(note.reply?.user?.host ?? '')) return true;
	if (mutedInstances.has(note.renote?.user?.host ?? '')) return true;

	return false;
}

export function isUserFromMutedInstance(notif: Packed<'Notification'>, mutedInstances: Set<string>): boolean {
	if ('user' in notif && mutedInstances.has(notif.user?.host ?? '')) return true;

	return false;
}
