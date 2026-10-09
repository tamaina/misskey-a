/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedJsonValue } from '../../users/backend/json-value.schema.js';
import type { MiDriveFile } from './models/DriveFile.js';

/** Competing selectors retain the original JSON values passed directly to TypeORM. */
export interface DriveFileSelectorRepository {
	findOneBy(selector: { id: PackedJsonValue } | ({ url: PackedJsonValue | undefined } | { webpublicUrl: PackedJsonValue | undefined } | { thumbnailUrl: PackedJsonValue | undefined })[]): Promise<MiDriveFile | null>;
}
