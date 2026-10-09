/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { serverInfoContract } from './endpoints/server-info.contract.js';

export function createServerInfoService(deps: {
	enabled(): boolean;
	read(): Promise<v.InferOutput<NonNullable<typeof serverInfoContract['~orpc']['outputSchema']>>>;
}) {
	return async () => {
		if (!deps.enabled()) return {
			machine: '?', cpu: { model: '?', cores: 0 },
			mem: { total: 0 }, fs: { total: 0, used: 0 },
		};
		return deps.read();
	};
}
