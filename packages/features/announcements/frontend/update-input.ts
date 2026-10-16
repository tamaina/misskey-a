/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { entities } from 'misskey-js';

/** Keep creation/list metadata out of patches and omit undefined optional fields. */
export function buildAnnouncementUpdate(input: entities.AdminAnnouncementsUpdateRequest): entities.AdminAnnouncementsUpdateRequest {
	const { id, title, text, imageUrl, icon, display, forExistingUsers, silence, needConfirmationToRead, isActive, autoArchiveAt } = input;
	return {
		id,
		...(title !== undefined ? { title } : {}),
		...(text !== undefined ? { text } : {}),
		...(imageUrl !== undefined ? { imageUrl } : {}),
		...(icon !== undefined ? { icon } : {}),
		...(display !== undefined ? { display } : {}),
		...(forExistingUsers !== undefined ? { forExistingUsers } : {}),
		...(silence !== undefined ? { silence } : {}),
		...(needConfirmationToRead !== undefined ? { needConfirmationToRead } : {}),
		...(isActive !== undefined ? { isActive } : {}),
		...(autoArchiveAt !== undefined ? { autoArchiveAt } : {}),
	};
}
