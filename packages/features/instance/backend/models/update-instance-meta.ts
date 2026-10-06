/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DataSource } from 'typeorm';
import { MiMeta } from './Meta.js';

/** Transitional persistence adapter shared by the legacy service and CLI. */
export function updateInstanceMeta(db: DataSource, data: Partial<MiMeta>) {
	return db.transaction(async manager => {
		// Preserve the legacy choice when an old installation contains duplicate rows.
		const before = (await manager.find(MiMeta, { order: { id: 'DESC' } }))[0];
		if (before) {
			await manager.update(MiMeta, before.id, data);
		} else {
			await manager.save(MiMeta, { ...data, id: 'x' });
		}
		const after = (await manager.find(MiMeta, { order: { id: 'DESC' } }))[0];
		return { before, after };
	});
}
